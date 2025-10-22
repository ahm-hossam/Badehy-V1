import { useEffect, useState, useCallback } from 'react';
import { 
  SafeAreaView, 
  Text, 
  StyleSheet, 
  ScrollView, 
  View, 
  Pressable,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';

export default function CheckinsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);

  const fetchCheckins = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      // Fetch client info
      const meRes = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meJson = await meRes.json();
      if (meRes.ok) {
        setClient(meJson.client);
      }

      // Fetch main form
      const formRes = await fetch(`${API}/mobile/forms/main`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const formJson = await formRes.json();
      if (formRes.ok) {
        setForm(formJson.form);
        setSubmissions(formJson.submissions || []);
      } else {
        setForm(null);
        setSubmissions([]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchCheckins(); 
  }, [fetchCheckins]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCheckins();
    setRefreshing(false);
  }, [fetchCheckins]);

  const getSubmissionStatus = (submission: any) => {
    const submittedAt = new Date(submission.submittedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return { status: 'Today', color: '#10B981' };
    if (daysDiff === 1) return { status: 'Yesterday', color: '#F59E0B' };
    if (daysDiff <= 7) return { status: `${daysDiff} days ago`, color: '#6B7280' };
    return { status: submittedAt.toLocaleDateString(), color: '#6B7280' };
  };

  const getFormProgress = () => {
    if (!form || !form.questions) return { completed: 0, total: 0 };
    
    const totalQuestions = form.questions.length;
    const requiredQuestions = form.questions.filter((q: any) => q.required).length;
    
    return { completed: requiredQuestions, total: totalQuestions };
  };

  const getCompletionPercentage = () => {
    const progress = getFormProgress();
    return progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading check-ins...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Check-ins</Text>
        <Text style={styles.headerSubtitle}>Track your progress and updates</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !form ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Check-in Form</Text>
            <Text style={styles.emptySubtitle}>
              Your trainer hasn't set up a check-in form yet.{'\n'}
              Check back later or contact your trainer.
            </Text>
          </View>
        ) : (
          <>
            {/* Form Overview */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Ionicons name="document-text" size={24} color="#4F46E5" />
                <Text style={styles.formTitle}>{form.name}</Text>
              </View>
              <Text style={styles.formDescription}>
                {form.description || 'Complete this form to update your trainer on your progress'}
              </Text>
              
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Form Progress</Text>
                  <Text style={styles.progressPercentage}>{getCompletionPercentage()}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${getCompletionPercentage()}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {getFormProgress().completed} of {getFormProgress().total} questions completed
                </Text>
              </View>

              <Pressable 
                style={styles.startFormButton}
                onPress={() => router.push('/form')}
              >
                <Text style={styles.startFormButtonText}>
                  {submissions.length > 0 ? 'Update Form' : 'Start Form'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Recent Submissions */}
            {submissions.length > 0 && (
              <View style={styles.submissionsCard}>
                <Text style={styles.cardTitle}>Recent Submissions</Text>
                {submissions.slice(0, 5).map((submission, index) => {
                  const status = getSubmissionStatus(submission);
                  return (
                    <View key={submission.id} style={styles.submissionItem}>
                      <View style={styles.submissionHeader}>
                        <View style={styles.submissionInfo}>
                          <Text style={styles.submissionTitle}>
                            Submission #{submissions.length - index}
                          </Text>
                          <Text style={styles.submissionDate}>
                            {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                          <Text style={[styles.statusText, { color: status.color }]}>
                            {status.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.submissionAnswers}>
                        {Object.keys(submission.answers).length} questions answered
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Form Questions Preview */}
            <View style={styles.questionsCard}>
              <Text style={styles.cardTitle}>Form Questions</Text>
              {form.questions.slice(0, 3).map((question: any, index: number) => (
                <View key={question.id} style={styles.questionItem}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>{index + 1}</Text>
                    <Text style={styles.questionLabel}>{question.label}</Text>
                    {question.required && (
                      <Text style={styles.requiredBadge}>Required</Text>
                    )}
                  </View>
                  <Text style={styles.questionType}>
                    {question.type === 'short' ? 'Short Answer' :
                     question.type === 'long' ? 'Long Answer' :
                     question.type === 'single' ? 'Single Choice' :
                     question.type === 'multi' ? 'Multiple Choice' :
                     question.type === 'file' ? 'File Upload' :
                     question.type === 'date' ? 'Date' :
                     question.type === 'time' ? 'Time' : question.type}
                  </Text>
                </View>
              ))}
              {form.questions.length > 3 && (
                <Text style={styles.moreQuestions}>
                  +{form.questions.length - 3} more questions
                </Text>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <Pressable 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/form')}
                >
                  <Ionicons name="create" size={28} color="#4F46E5" />
                  <Text style={styles.quickActionText}>Fill Form</Text>
                </Pressable>
                
                <Pressable style={styles.quickActionButton}>
                  <Ionicons name="eye" size={28} color="#10B981" />
                  <Text style={styles.quickActionText}>View Form</Text>
                </Pressable>
                
                <Pressable style={styles.quickActionButton}>
                  <Ionicons name="time" size={28} color="#F59E0B" />
                  <Text style={styles.quickActionText}>History</Text>
                </Pressable>
                
                <Pressable style={styles.quickActionButton}>
                  <Ionicons name="help-circle" size={28} color="#8B5CF6" />
                  <Text style={styles.quickActionText}>Help</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  formDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  startFormButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startFormButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  submissionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  submissionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  submissionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  submissionAnswers: {
    fontSize: 14,
    color: '#6B7280',
  },
  questionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  questionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  requiredBadge: {
    fontSize: 10,
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questionType: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 36,
  },
  moreQuestions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  quickActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  quickActionText: {
    fontSize: 12,
    color: '#111827',
    marginTop: 8,
    fontWeight: '500',
  },
});


