import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { usePropertyStore } from '../../../src/stores/propertyStore';
import { useProject, useUpdateProject } from '../../../src/hooks/useProjects';
import { useCategories } from '../../../src/hooks/useCategories';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import type { ProjectStatus, ProjectPriority } from '../../../src/types';

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITIES: { value: ProjectPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeProperty } = usePropertyStore();
  const { data: project, isLoading } = useProject(id);
  const { data: categories } = useCategories(activeProperty?.id);
  const updateProject = useUpdateProject();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('pending');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || '');
      setStatus(project.status);
      setPriority(project.priority);
      setCategoryId(project.category_id);
    }
  }, [project]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a project title');
      return;
    }

    if (!id) return;

    setSaving(true);
    try {
      await updateProject.mutateAsync({
        id,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        category_id: categoryId || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Project',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter project title"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter project description"
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {categories?.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    categoryId === cat.id && styles.chipSelected,
                    categoryId === cat.id && { borderColor: cat.color },
                  ]}
                  onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                >
                  <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                  <Text
                    style={[
                      styles.chipText,
                      categoryId === cat.id && styles.chipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.chips}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.chip,
                    status === s.value && styles.chipSelected,
                  ]}
                  onPress={() => setStatus(s.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      status === s.value && styles.chipTextSelected,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority */}
          <View style={styles.field}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.chips}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.chip,
                    priority === p.value && styles.chipSelected,
                    priority === p.value && { borderColor: p.color },
                  ]}
                  onPress={() => setPriority(p.value)}
                >
                  <View style={[styles.chipDot, { backgroundColor: p.color }]} />
                  <Text
                    style={[
                      styles.chipText,
                      priority === p.value && styles.chipTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  saveButton: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  textArea: {
    minHeight: 100,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4e',
    gap: 8,
  },
  chipSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#1a1a3e',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    color: '#888',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#fff',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 48,
  },
});
