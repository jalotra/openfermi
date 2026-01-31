package com.law.tech.backend.base.query;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A tree node for logical grouping. Either a group (operator + children) or a leaf (condition). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterNode {
    // Group node fields
    private LogicalOperator operator; // AND / OR for group nodes
    private List<FilterNode> children; // group children

    // Leaf condition
    private Filter condition; // set for leaf nodes

    // Optional NOT for either group or leaf
    private boolean negated;

    public boolean isLeaf() {
        return condition != null;
    }
}
