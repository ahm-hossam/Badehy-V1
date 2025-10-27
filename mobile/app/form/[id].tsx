import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';

interface Question {
  id: number;
  label: string;
  type: 'short' | 'long' | 'single' | 'multi' | 'file' | 'date' | 'time';
  required: boolean;
  options?: string[];
  order: number;
}

interface Form {
  id: number;
  name: string;
  questions: Question[];
}

export default function AssignedFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const formId = params.id;
  const assignedId = params.assignedId;

  const [form, setForm] = useState<Form | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchForm();
  }, [formId, assignedId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const token = (globalThis as any).ACCESS_TOKEN;

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API}/mobile/forms/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const assignedForm = data.forms.find((f: any) => f.id === Number(assignedId));
        
        if (assignedForm) {
          setForm(assignedForm.form);
        } else {
          setError('Form not found');
        }
      } else {
        setError('Failed to load form');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const nextStep = () => {
    if (currentStep < (form?.questions.length || 0) - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateCurrentStep = () => {
    if (!form) return true;
    
    const currentQuestion = form.questions[currentStep];
    if (!currentQuestion.required) return true;
    
    const answer = answers[currentQuestion.id];
    return answer && answer !== '' && (!Array.isArray(answer) || answer.length > 0);
  };

  const submitForm = async () => {
    if (!form) return;

    try {
      setSubmitting(true);
      const token = (globalThis as any).ACCESS_TOKEN;

      const response = await fetch(`${API}/mobile/forms/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          formId: form.id,
          answers: answers,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          'Form submitted successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to submit form');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';

    switch (question.type) {
      case 'short':
        return (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => handleAnswerChange(question.id, text)}
            placeholder="Enter your answer"
            autoCapitalize="sentences"
          />
        );

      case 'long':
        return (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={value}
            onChangeText={(text) => handleAnswerChange(question.id, text)}
            placeholder="Enter your answer"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );

      case 'single':
        return (
          <View style={styles.optionsContainer}>
            {question.options?.map((option, index) => (
              <Pressable
                key={index}
                style={[
                  styles.optionButton,
                  value === option && styles.optionButtonSelected
                ]}
                onPress={() => handleAnswerChange(question.id, option)}
              >
                <Text style={[
                  styles.optionText,
                  value === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                {value === option && (
                  <Ionicons name="checkmark-circle" size={20} color="#111827" />
                )}
              </Pressable>
            ))}
          </View>
        );

      case 'multi':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <View style={styles.optionsContainer}>
            {question.options?.map((option, index) => (
              <Pressable
                key={index}
                style={[
                  styles.optionButton,
                  selectedValues.includes(option) && styles.optionButtonSelected
                ]}
                onPress={() => {
                  const newValues = selectedValues.includes(option)
                    ? selectedValues.filter(v => v !== option)
                    : [...selectedValues, option];
                  handleAnswerChange(question.id, newValues);
                }}
              >
                <Text style={[
                  styles.optionText,
                  selectedValues.includes(option) && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                {selectedValues.includes(option) && (
                  <Ionicons name="checkmark-circle" size={20} color="#111827" />
                )}
              </Pressable>
            ))}
          </View>
        );

      default:
        return (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => handleAnswerChange(question.id, text)}
            placeholder="Enter your answer"
          />
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !form) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Form not found'}</Text>
          <Pressable style={styles.retryButton} onPress={fetchForm}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = form.questions[currentStep];
  const progress = ((currentStep + 1) / form.questions.length) * 100;
  const isLastStep = currentStep === form.questions.length - 1;
  const canProceed = validateCurrentStep();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Close Button */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.topHeaderTitle}>Form</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{form.name}</Text>
        <Text style={styles.subtitle}>
          Question {currentStep + 1} of {form.questions.length}
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {currentQuestion.label}
            {currentQuestion.required && <Text style={styles.required}> *</Text>}
          </Text>
          
          {renderQuestion(currentQuestion)}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <Pressable
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={prevStep}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentStep === 0 ? "#9CA3AF" : "#111827"} />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </Pressable>

        {isLastStep ? (
          <Pressable
            style={[styles.submitButton, !canProceed && styles.submitButtonDisabled]}
            onPress={submitForm}
            disabled={!canProceed || submitting}
          >
            <Text style={[styles.submitButtonText, !canProceed && styles.submitButtonTextDisabled]}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Text>
            <Ionicons name="checkmark" size={20} color={canProceed ? "#FFFFFF" : "#9CA3AF"} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.navButton, styles.navButtonPrimary, !canProceed && styles.navButtonDisabled]}
            onPress={nextStep}
            disabled={!canProceed}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary, !canProceed && styles.navButtonTextDisabled]}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={20} color={canProceed ? "#FFFFFF" : "#9CA3AF"} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    lineHeight: 24,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  optionButtonSelected: {
    borderColor: '#111827',
    backgroundColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  optionTextSelected: {
    color: '#111827',
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  submitButtonTextDisabled: {
    color: '#FFFFFF',
  },
});
