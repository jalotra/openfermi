package com.law.tech.backend.base.query;

import com.law.tech.backend.base.BaseMapper;
import com.law.tech.backend.base.BaseRepository;
import com.law.tech.backend.base.models.BaseDto;
import com.law.tech.backend.base.models.BaseEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

public abstract class AbstractQueryServiceImpl<T extends BaseEntity, K extends BaseDto, R extends BaseRepository<T>>
        implements QueryService<T> {
    protected final R repository;
    protected final BaseMapper<K, T> mapper;

    @PersistenceContext
    protected EntityManager em;

    @Autowired
    private SearchableFieldDetector fieldDetector;

    @Autowired
    private FieldValueProvider fieldValueProvider;

    public AbstractQueryServiceImpl(R repository, BaseMapper<K, T> mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Slice<T> query(QueryRequest request) {
        Objects.requireNonNull(request, "request");
        int page = request.getPage() != null ? Math.max(request.getPage(), 0) : 0;
        int size = request.getSize() != null ? Math.max(request.getSize(), 1) : 20;
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<T> cq = cb.createQuery(getEntityClass());
        Root<T> root = cq.from(getEntityClass());
        List<Predicate> predicates = new ArrayList<>();

        // Full-text-ish search across searchable fields
        if (request.getQ() != null && !request.getQ().isBlank()) {
            String like = likePattern(request.getQ());
            List<Predicate> or = new ArrayList<>();
            for (FieldDefinition fd : getSearchableFields()) {
                if (fd.isSearchable()) {
                    or.add(cb.like(cb.lower(root.get(fd.getEntityPath())), like));
                }
            }
            if (!or.isEmpty()) {
                predicates.add(cb.or(or.toArray(Predicate[]::new)));
            }
        }

        Predicate structured = null;
        if (request.getWhere() != null) {
            structured = nodeToPredicate(request.getWhere(), cb, root);
        }

        if (structured != null) {
            predicates.add(structured);
        }

        cq.where(predicates.toArray(Predicate[]::new));

        // Sorting
        List<jakarta.persistence.criteria.Order> orders = new ArrayList<>();
        if (request.getSorts() != null && !request.getSorts().isEmpty()) {
            for (SortSpec s : request.getSorts()) {
                FieldDefinition fd = resolveField(s.getField())
                        .orElseThrow(() -> new IllegalArgumentException("Unknown sort field: " + s.getField()));
                if (s.isAscending()) {
                    orders.add(cb.asc(root.get(fd.getEntityPath())));
                } else {
                    orders.add(cb.desc(root.get(fd.getEntityPath())));
                }
            }
        } else {
            addDefaultSort(orders, cb, root);
        }
        cq.orderBy(orders);

        TypedQuery<T> tq = em.createQuery(cq);
        // Slice pagination: fetch size+1 to detect hasNext
        tq.setFirstResult(page * size);
        tq.setMaxResults(size + 1);

        List<T> results = tq.getResultList();
        boolean hasNext = results.size() > size;
        if (hasNext) {
            results = results.subList(0, size);
        }

        Pageable pageable = Pageable.ofSize(size).withPage(page);
        return new SliceImpl<>(results, pageable, hasNext);
    }

    private Predicate nodeToPredicate(FilterNode node, CriteriaBuilder cb, Root<T> root) {
        if (node == null) return cb.conjunction();
        Predicate pred;
        if (node.isLeaf()) {
            pred = filterToPredicate(node.getCondition(), cb, root);
        } else {
            List<Predicate> children = new ArrayList<>();
            if (node.getChildren() != null) {
                for (FilterNode child : node.getChildren()) {
                    children.add(nodeToPredicate(child, cb, root));
                }
            }
            if (node.getOperator() == LogicalOperator.OR) {
                pred = cb.or(children.toArray(Predicate[]::new));
            } else {
                pred = cb.and(children.toArray(Predicate[]::new));
            }
        }
        if (node.isNegated()) {
            pred = cb.not(pred);
        }
        return pred;
    }

    private Predicate filterToPredicate(Filter f, CriteriaBuilder cb, Root<T> root) {
        FieldDefinition fd = resolveField(f.getField())
                .orElseThrow(() -> new IllegalArgumentException("Unknown field: " + f.getField()));

        String path = fd.getEntityPath();
        Operation op = f.getOp();

        switch (op) {
            case EQUALS -> {
                String v = firstValue(f);
                Predicate p = cb.equal(cb.lower(root.get(path)), v.toLowerCase(Locale.ROOT));
                return f.isNegated() ? cb.not(p) : p;
            }
            case NOT_EQUALS -> {
                String v = firstValue(f);
                Predicate p = cb.notEqual(cb.lower(root.get(path)), v.toLowerCase(Locale.ROOT));
                return f.isNegated() ? cb.not(p) : p;
            }
            case CONTAINS -> {
                String v = firstValue(f);
                Predicate p = cb.like(cb.lower(root.get(path)), likePattern(v));
                return f.isNegated() ? cb.not(p) : p;
            }
            case STARTS_WITH -> {
                String v = firstValue(f);
                Predicate p = cb.like(cb.lower(root.get(path)), startsWithPattern(v));
                return f.isNegated() ? cb.not(p) : p;
            }
            case ENDS_WITH -> {
                String v = firstValue(f);
                Predicate p = cb.like(cb.lower(root.get(path)), endsWithPattern(v));
                return f.isNegated() ? cb.not(p) : p;
            }
            case IN -> {
                var in = cb.in(cb.lower(root.get(path)));
                for (String v : f.getValues()) {
                    in.value(v.toLowerCase(Locale.ROOT));
                }
                return f.isNegated() ? cb.not(in) : in;
            }
            case YEAR_EQUALS -> {
                String year = firstValue(f);
                Predicate p = cb.like(root.get(path), "%" + year + "%");
                return f.isNegated() ? cb.not(p) : p;
            }
            case YEAR_IN -> {
                List<Predicate> ors = new ArrayList<>();
                for (String year : f.getValues()) {
                    ors.add(cb.like(root.get(path), "%" + year + "%"));
                }
                Predicate p = cb.or(ors.toArray(Predicate[]::new));
                return f.isNegated() ? cb.not(p) : p;
            }
            case YEAR_BETWEEN -> {
                int start = Integer.parseInt(f.getValues().get(0));
                int end = Integer.parseInt(f.getValues().get(1));
                Predicate p = yearRangePredicate(path, start, end, cb, root);
                return f.isNegated() ? cb.not(p) : p;
            }
            case YEAR_LESS_THAN -> {
                int end = Integer.parseInt(firstValue(f)) - 1;
                Predicate p = yearRangePredicate(path, 1900, end, cb, root);
                return f.isNegated() ? cb.not(p) : p;
            }
            case YEAR_GREATER_THAN -> {
                int start = Integer.parseInt(firstValue(f)) + 1;
                Predicate p = yearRangePredicate(path, start, 2100, cb, root);
                return f.isNegated() ? cb.not(p) : p;
            }
            case YEAR_LESS_THAN_OR_EQUAL -> {
                int end = Integer.parseInt(firstValue(f));
                Predicate p = yearRangePredicate(path, 1900, end, cb, root);
                return f.isNegated() ? cb.not(p) : p;
            }
            case YEAR_GREATER_THAN_OR_EQUAL -> {
                int start = Integer.parseInt(firstValue(f));
                Predicate p = yearRangePredicate(path, start, 2100, cb, root);
                return f.isNegated() ? cb.not(p) : p;
            }
            default -> throw new IllegalArgumentException("Unsupported operation: " + op);
        }
    }

    private Predicate yearRangePredicate(String path, int start, int end, CriteriaBuilder cb, Root<T> root) {
        if (end < start) {
            // empty range – return false predicate
            return cb.disjunction();
        }
        List<Predicate> ors = new ArrayList<>();
        for (int y = start; y <= end; y++) {
            ors.add(cb.like(root.get(path), "%" + y + "%"));
        }
        return cb.or(ors.toArray(Predicate[]::new));
    }

    private static String firstValue(Filter f) {
        if (f.getValues() == null || f.getValues().isEmpty()) {
            throw new IllegalArgumentException("Missing filter value for field: " + f.getField());
        }
        return f.getValues().get(0);
    }

    private static String likePattern(String v) {
        return "%" + v.toLowerCase(Locale.ROOT) + "%";
    }

    private static String startsWithPattern(String v) {
        return v.toLowerCase(Locale.ROOT) + "%";
    }

    private static String endsWithPattern(String v) {
        return "%" + v.toLowerCase(Locale.ROOT);
    }

    // Abstract methods that subclasses must implement
    protected abstract Class<T> getEntityClass();

    protected abstract EntityType getEntityType();

    /**
     * Override this method if you need custom field definitions beyond @SearchableField annotations By default, fields
     * are automatically detected using @SearchableField annotations
     */
    protected List<FieldDefinition> defineCustomFields() {
        return List.of(); // Default: no custom fields
    }

    // Register fields on first access (lazy initialization)
    private void ensureFieldsRegistered() {
        FieldRegistry registry = FieldRegistry.getInstance();
        List<FieldDefinition> existingFields = registry.getFields(getEntityType());

        // Only register if no fields exist for this entity type yet
        if (existingFields.isEmpty()) {
            // Automatically detect fields using @SearchableField annotations
            List<FieldDefinition> autoDetectedFields = fieldDetector.detectFields(getEntityClass(), getEntityType());

            // Add any custom fields defined by subclasses
            List<FieldDefinition> customFields = defineCustomFields();

            // Combine auto-detected and custom fields
            List<FieldDefinition> allFields = new ArrayList<>();
            allFields.addAll(autoDetectedFields);
            allFields.addAll(customFields);

            registry.registerFields(getEntityType(), allFields);
        }
    }

    // Default implementations using entity-specific field registry
    protected List<FieldDefinition> getSearchableFields() {
        ensureFieldsRegistered();
        return FieldRegistry.getInstance().getFields(getEntityType()).stream()
                .filter(FieldDefinition::isSearchable)
                .collect(Collectors.toList());
    }

    public List<FieldDefinition> getFilterableFields() {
        ensureFieldsRegistered();
        return FieldRegistry.getInstance().getFields(getEntityType()).stream()
                .filter(FieldDefinition::isFilterable)
                .collect(Collectors.toList());
    }

    @Override
    public FieldDefinitionValue getFieldDefinitionValues(String fieldName) {
        ensureFieldsRegistered();

        Optional<FieldDefinition> fieldDefOpt = FieldRegistry.getInstance().resolve(getEntityType(), fieldName);
        if (fieldDefOpt.isEmpty()) {
            return FieldDefinitionValue.builder()
                    .name(fieldName)
                    .values(List.of())
                    .build();
        }

        FieldDefinition fieldDef = fieldDefOpt.get();
        return fieldValueProvider.getFieldValues(getEntityClass(), fieldDef);
    }

    protected Optional<FieldDefinition> resolveField(String fieldName) {
        ensureFieldsRegistered();
        return FieldRegistry.getInstance().resolve(getEntityType(), fieldName);
    }

    // Optional method for default sorting - subclasses can override
    protected void addDefaultSort(List<jakarta.persistence.criteria.Order> orders, CriteriaBuilder cb, Root<T> root) {}
}
