package com.law.tech.backend.questions.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.law.tech.backend.base.AbstractIntegrationTest;
import com.law.tech.backend.questions.models.Question;
import com.law.tech.backend.questions.models.dtos.QuestionDto;
import com.law.tech.backend.questions.repositories.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureWebMvc
class QuestionControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private QuestionDto testQuestionDto;
    private Question testQuestion;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        questionRepository.deleteAll();
        
        testQuestionDto = QuestionDto.builder()
                .questionText("What is the derivative of sin(x)?")
                .subject(Question.Subject.MATHEMATICS)
                .examType(Question.ExamType.JEE_MAIN)
                .difficulty(Question.DifficultyLevel.EASY)
                .options(Arrays.asList("cos(x)", "-cos(x)", "tan(x)", "-tan(x)"))
                .correctAnswer("cos(x)")
                .explanation("The derivative of sin(x) with respect to x is cos(x) by basic differentiation rules.")
                .imageUrls(Arrays.asList("https://example.com/image1.png", "https://example.com/image2.png"))
                .year(2023)
                .paperNumber(1)
                .questionNumber(25)
                .tags(Arrays.asList("calculus", "derivatives", "trigonometry"))
                .topic("Differentiation")
                .marks(4)
                .negativeMarks(-1.0)
                .isActive(true)
                .build();

        testQuestion = new Question();
        testQuestion.setQuestionText("What is the chemical formula of water?");
        testQuestion.setSubject(Question.Subject.CHEMISTRY);
        testQuestion.setExamType(Question.ExamType.NEET);
        testQuestion.setDifficulty(Question.DifficultyLevel.EASY);
        testQuestion.setOptions(Arrays.asList("H2O", "CO2", "O2", "N2"));
        testQuestion.setCorrectAnswer("H2O");
        testQuestion.setExplanation("Water consists of two hydrogen atoms and one oxygen atom, giving the formula H2O.");
        testQuestion.setYear(2022);
        testQuestion.setPaperNumber(2);
        testQuestion.setQuestionNumber(10);
        testQuestion.setTags(Arrays.asList("chemistry", "basics", "molecules"));
        testQuestion.setTopic("Chemical Formulas");
        testQuestion.setMarks(4);
        testQuestion.setNegativeMarks(-1.0);
        testQuestion.setIsActive(true);
    }

    @Test
    @DisplayName("Should create a new question")
    void testCreateQuestion() throws Exception {
        mockMvc.perform(post("/questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testQuestionDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.questionText", is("What is the derivative of sin(x)?")))
                .andExpect(jsonPath("$.data.subject", is("MATHEMATICS")))
                .andExpect(jsonPath("$.data.examType", is("JEE_MAIN")))
                .andExpect(jsonPath("$.data.difficulty", is("EASY")))
                .andExpect(jsonPath("$.data.correctAnswer", is("cos(x)")))
                .andExpect(jsonPath("$.data.marks", is(4)))
                .andExpect(jsonPath("$.data.negativeMarks", is(-1.0)))
                .andExpect(jsonPath("$.data.isActive", is(true)))
                .andExpect(jsonPath("$.data.options", hasSize(4)))
                .andExpect(jsonPath("$.data.options", contains("cos(x)", "-cos(x)", "tan(x)", "-tan(x)")))
                .andExpect(jsonPath("$.data.tags", hasSize(3)))
                .andExpect(jsonPath("$.data.imageUrls", hasSize(2)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.createdAt", notNullValue()));
    }

    @Test
    @DisplayName("Should get question by ID")
    void testGetQuestionById() throws Exception {
        Question savedQuestion = questionRepository.save(testQuestion);

        mockMvc.perform(get("/questions/{id}", savedQuestion.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.id", is(savedQuestion.getId().toString())))
                .andExpect(jsonPath("$.data.questionText", is("What is the chemical formula of water?")))
                .andExpect(jsonPath("$.data.subject", is("CHEMISTRY")))
                .andExpect(jsonPath("$.data.examType", is("NEET")))
                .andExpect(jsonPath("$.data.difficulty", is("EASY")))
                .andExpect(jsonPath("$.data.correctAnswer", is("H2O")))
                .andExpect(jsonPath("$.data.marks", is(4)))
                .andExpect(jsonPath("$.data.year", is(2022)))
                .andExpect(jsonPath("$.data.questionNumber", is(10)));
    }

    @Test
    @DisplayName("Should return 404 when question not found")
    void testGetQuestionByIdNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        mockMvc.perform(get("/questions/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should update an existing question")
    void testUpdateQuestion() throws Exception {
        Question savedQuestion = questionRepository.save(testQuestion);

        QuestionDto updateDto = QuestionDto.builder()
                .id(savedQuestion.getId())
                .questionText("Updated: What is the chemical formula of carbon dioxide?")
                .subject(Question.Subject.CHEMISTRY)
                .examType(Question.ExamType.JEE_ADVANCED)
                .difficulty(Question.DifficultyLevel.MEDIUM)
                .options(Arrays.asList("H2O", "CO2", "O2", "CH4"))
                .correctAnswer("CO2")
                .explanation("Updated explanation: Carbon dioxide has one carbon atom and two oxygen atoms.")
                .imageUrls(Arrays.asList("https://example.com/co2.png"))
                .year(2023)
                .paperNumber(1)
                .questionNumber(15)
                .tags(Arrays.asList("chemistry", "gases", "molecules", "updated"))
                .topic("Updated Topic")
                .marks(5)
                .negativeMarks(-1.25)
                .isActive(false)
                .build();

        mockMvc.perform(put("/questions/{id}", savedQuestion.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.id", is(savedQuestion.getId().toString())))
                .andExpect(jsonPath("$.data.questionText", is("Updated: What is the chemical formula of carbon dioxide?")))
                .andExpect(jsonPath("$.data.examType", is("JEE_ADVANCED")))
                .andExpect(jsonPath("$.data.difficulty", is("MEDIUM")))
                .andExpect(jsonPath("$.data.correctAnswer", is("CO2")))
                .andExpect(jsonPath("$.data.marks", is(5)))
                .andExpect(jsonPath("$.data.negativeMarks", is(-1.25)))
                .andExpect(jsonPath("$.data.isActive", is(false)))
                .andExpect(jsonPath("$.data.tags", hasSize(4)))
                .andExpect(jsonPath("$.data.imageUrls", hasSize(1)));
    }

    @Test
    @DisplayName("Should delete a question")
    void testDeleteQuestion() throws Exception {
        Question savedQuestion = questionRepository.save(testQuestion);

        mockMvc.perform(delete("/questions/{id}", savedQuestion.getId()))
                .andExpect(status().isOk());

        assertFalse(questionRepository.existsById(savedQuestion.getId()));
    }

    @Test
    @DisplayName("Should return 404 when deleting non-existent question")
    void testDeleteQuestionNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        mockMvc.perform(delete("/questions/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should get all questions with pagination")
    void testGetAllQuestions() throws Exception {
        questionRepository.save(testQuestion);
        
        Question question2 = new Question();
        question2.setQuestionText("What is Newton's second law?");
        question2.setSubject(Question.Subject.PHYSICS);
        question2.setExamType(Question.ExamType.JEE_MAIN);
        question2.setDifficulty(Question.DifficultyLevel.MEDIUM);
        question2.setOptions(Arrays.asList("F=ma", "F=mv", "F=mg", "F=mv²"));
        question2.setCorrectAnswer("F=ma");
        question2.setExplanation("Newton's second law states that force equals mass times acceleration.");
        question2.setIsActive(true);
        question2.setOptions(Arrays.asList());
        questionRepository.save(question2);

        mockMvc.perform(get("/questions")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].subject", hasItems("CHEMISTRY", "PHYSICS")))
                .andExpect(jsonPath("$.data[*].examType", hasItems("NEET", "JEE_MAIN")));
    }

    @Test
    @DisplayName("Should get questions with sorting")
    void testGetQuestionsWithSorting() throws Exception {
        questionRepository.save(testQuestion);
        
        Question question2 = new Question();
        question2.setQuestionText("What is Newton's second law?");
        question2.setSubject(Question.Subject.PHYSICS);
        question2.setExamType(Question.ExamType.JEE_MAIN);
        question2.setDifficulty(Question.DifficultyLevel.MEDIUM);
        question2.setOptions(Arrays.asList());
        question2.setCorrectAnswer("F=ma");
        question2.setIsActive(true);
        questionRepository.save(question2);

        mockMvc.perform(get("/questions/sorted")
                .param("direction", "DESC")
                .param("sortBy", "createdAt")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    @DisplayName("Should get question count")
    void testGetQuestionCount() throws Exception {
        questionRepository.save(testQuestion);
        
        Question question2 = new Question();
        question2.setQuestionText("What is Newton's second law?");
        question2.setSubject(Question.Subject.PHYSICS);
        question2.setExamType(Question.ExamType.JEE_MAIN);
        question2.setOptions(Arrays.asList());
        question2.setCorrectAnswer("F=ma");
        question2.setIsActive(true);
        questionRepository.save(question2);

        mockMvc.perform(get("/questions/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is(2)));
    }

    @Test
    @DisplayName("Should handle different exam types and subjects")
    void testExamTypesAndSubjects() throws Exception {
        QuestionDto physicsQuestion = QuestionDto.builder()
                .questionText("What is the speed of light in vacuum?")
                .subject(Question.Subject.PHYSICS)
                .examType(Question.ExamType.JEE_ADVANCED)
                .difficulty(Question.DifficultyLevel.HARD)
                .options(Arrays.asList("3x10⁸ m/s", "2x10⁸ m/s", "4x10⁸ m/s", "1x10⁸ m/s"))
                .correctAnswer("3x10⁸ m/s")
                .explanation("The speed of light in vacuum is approximately 3×10⁸ m/s.")
                .marks(5)
                .negativeMarks(-1.25)
                .isActive(true)
                .build();

        QuestionDto biologyQuestion = QuestionDto.builder()
                .questionText("What is the powerhouse of the cell?")
                .subject(Question.Subject.BIOLOGY)
                .examType(Question.ExamType.NEET)
                .difficulty(Question.DifficultyLevel.EASY)
                .options(Arrays.asList("Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"))
                .correctAnswer("Mitochondria")
                .explanation("Mitochondria are known as the powerhouse of the cell as they generate ATP.")
                .marks(4)
                .negativeMarks(-1.0)
                .isActive(true)
                .build();

        mockMvc.perform(post("/questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(physicsQuestion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subject", is("PHYSICS")))
                .andExpect(jsonPath("$.data.examType", is("JEE_ADVANCED")))
                .andExpect(jsonPath("$.data.difficulty", is("HARD")));

        mockMvc.perform(post("/questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(biologyQuestion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subject", is("BIOLOGY")))
                .andExpect(jsonPath("$.data.examType", is("NEET")))
                .andExpect(jsonPath("$.data.difficulty", is("EASY")));
    }

    @Test
    @DisplayName("Should handle questions with minimal required fields")
    void testMinimalQuestionCreation() throws Exception {
        QuestionDto minimalDto = QuestionDto.builder()
                .questionText("Simple question?")
                .subject(Question.Subject.MATHEMATICS)
                .examType(Question.ExamType.JEE_MAIN)
                .options(Arrays.asList("A", "B", "C", "D"))
                .correctAnswer("A")
                .isActive(true)
                .build();

        mockMvc.perform(post("/questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(minimalDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questionText", is("Simple question?")))
                .andExpect(jsonPath("$.data.subject", is("MATHEMATICS")))
                .andExpect(jsonPath("$.data.examType", is("JEE_MAIN")))
                .andExpect(jsonPath("$.data.correctAnswer", is("A")))
                .andExpect(jsonPath("$.data.isActive", is(true)))
                .andExpect(jsonPath("$.data.difficulty", nullValue()))
                .andExpect(jsonPath("$.data.marks", nullValue()));
    }

    @Test
    @DisplayName("Should validate required fields")
    void testValidation() throws Exception {
        QuestionDto invalidDto = new QuestionDto();

        mockMvc.perform(post("/questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle questions without images")
    void testQuestionWithoutImages() throws Exception {
        QuestionDto questionWithoutImages = QuestionDto.builder()
                .questionText("Question without images?")
                .subject(Question.Subject.CHEMISTRY)
                .examType(Question.ExamType.JEE_MAIN)
                .options(Arrays.asList("A", "B", "C", "D"))
                .correctAnswer("B")
                .explanation("No images needed for this question.")
                .isActive(true)
                .build();

        mockMvc.perform(post("/questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(questionWithoutImages)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questionText", is("Question without images?")))
                .andExpect(jsonPath("$.data.imageUrls", nullValue()));
    }

    @Test
    @DisplayName("Should handle questions with complex metadata")
    void testQuestionWithComplexMetadata() throws Exception {
        QuestionDto complexQuestion = QuestionDto.builder()
                .questionText("Complex integration problem?")
                .subject(Question.Subject.MATHEMATICS)
                .examType(Question.ExamType.JEE_ADVANCED)
                .difficulty(Question.DifficultyLevel.HARD)
                .options(Arrays.asList("π/2", "π", "2π", "0"))
                .correctAnswer("π/2")
                .explanation("This involves integration by parts and trigonometric identities.")
                .imageUrls(Arrays.asList(
                    "https://example.com/eq1.png", 
                    "https://example.com/eq2.png", 
                    "https://example.com/solution.png"
                ))
                .year(2023)
                .paperNumber(3)
                .questionNumber(45)
                .tags(Arrays.asList("integration", "calculus", "definite-integrals", "trigonometry", "advanced"))
                .topic("Advanced Integration Techniques")
                .marks(6)
                .negativeMarks(-1.5)
                .isActive(true)
                .build();

        mockMvc.perform(post("/questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(complexQuestion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.difficulty", is("HARD")))
                .andExpect(jsonPath("$.data.marks", is(6)))
                .andExpect(jsonPath("$.data.negativeMarks", is(-1.5)))
                .andExpect(jsonPath("$.data.year", is(2023)))
                .andExpect(jsonPath("$.data.paperNumber", is(3)))
                .andExpect(jsonPath("$.data.questionNumber", is(45)))
                .andExpect(jsonPath("$.data.imageUrls", hasSize(3)))
                .andExpect(jsonPath("$.data.tags", hasSize(5)))
                .andExpect(jsonPath("$.data.topic", is("Advanced Integration Techniques")));
    }
}