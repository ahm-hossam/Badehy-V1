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
  Animated,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

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

export default function FormScreen() {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [preFillData, setPreFillData] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchMainForm();
  }, []);

  const fetchMainForm = async () => {
    try {
      setLoading(true);
      setError('');
      const token = (globalThis as any).ACCESS_TOKEN;
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API}/mobile/forms/main`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.completed) {
          // Form already completed, go to main app
          router.replace('/(tabs)/home');
          return;
        }
        setForm(data.form);
        
        // Set pre-filled data from trainer
        if (data.preFillData && Object.keys(data.preFillData).length > 0) {
          setPreFillData(data.preFillData);
          setAnswers(data.preFillData); // Initialize answers with pre-filled data
        }
      } else {
        setError(data.error || 'Failed to load form');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      const token = (globalThis as any).ACCESS_TOKEN;
      await fetch(`${API}/mobile/forms/draft`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId: form?.id,
          answers: answers
        })
      });
    } catch (error) {
      console.log('Failed to save draft:', error);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    // Auto-save draft
    saveDraft();
  };

  const nextStep = () => {
    if (currentStep < (form?.questions.length || 0) - 1) {
      Animated.timing(slideAnim, {
        toValue: -(currentStep + 1) * Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      Animated.timing(slideAnim, {
        toValue: -(currentStep - 1) * Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
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
      setError('');
      
      const token = (globalThis as any).ACCESS_TOKEN;
      const response = await fetch(`${API}/mobile/forms/submit`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId: form.id,
          answers: answers
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(
          'Success!',
          'Form submitted successfully. Welcome to the app!',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)/home') }]
        );
      } else {
        setError(data.error || 'Failed to submit form');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
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

      case 'date':
        return (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => handleAnswerChange(question.id, text)}
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
          />
        );

      case 'time':
        return (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => handleAnswerChange(question.id, text)}
            placeholder="HH:MM"
            keyboardType="numeric"
          />
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {error.includes('No main form found') && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>What does this mean?</Text>
              <Text style={styles.instructionsText}>
                Your trainer needs to create and publish a check-in form for you. Please contact your trainer to:
              </Text>
              <Text style={styles.instructionsBullet}>• Create a check-in form</Text>
              <Text style={styles.instructionsBullet}>• Mark it as "Main Form"</Text>
              <Text style={styles.instructionsBullet}>• Enable "Published" toggle</Text>
            </View>
          )}
          <Pressable style={styles.retryButton} onPress={fetchMainForm}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
          <Pressable style={styles.skipButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!form) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No form found</Text>
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
          
          {/* Show pre-filled badge if this question has pre-filled data */}
          {preFillData[currentQuestion.id] && (
            <View style={styles.preFilledBadge}>
              <Text style={styles.preFilledText}>
                ✓ Pre-filled by your trainer (you can edit)
              </Text>
            </View>
          )}
          
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
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    maxWidth: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  instructionsBullet: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginBottom: 4,
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
  preFilledBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  preFilledText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
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
