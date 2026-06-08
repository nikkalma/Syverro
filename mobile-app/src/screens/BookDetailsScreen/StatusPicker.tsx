// src/screens/BookDetailsScreen/StatusPicker.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { spacing, radii } from '../../theme/spacing';
import { useLanguage } from '../../context/LanguageContext';

interface StatusPickerProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  theme: any;
}

export default function StatusPicker({ selectedStatus, onStatusChange, theme }: StatusPickerProps) {
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const statuses = [
    { key: 'reading', label: t('status.reading') || 'Читаю' },
    { key: 'finished', label: t('status.finished') || 'Прочитано' },
    { key: 'planned', label: t('status.planned') || 'В планах' },
    { key: 'rereading', label: t('status.rereading') || 'Перечитываю' },
    { key: 'postponed', label: t('status.postponed') || 'Отложено' },
    { key: 'abandoned', label: t('status.abandoned') || 'Брошено' },
  ];

  const currentLabel = statuses.find(s => s.key === selectedStatus)?.label || 'Выберите статус';

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          backgroundColor: theme.surface,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text style={{ color: theme.textPrimary }}>📌 {currentLabel}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: radii.xl, padding: spacing.lg }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.lg, textAlign: 'center' }}>
              {t('bookDetails.status') || 'Выберите статус'}
            </Text>
            {statuses.map(status => (
              <TouchableOpacity
                key={status.key}
                onPress={() => {
                  onStatusChange(status.key);
                  setModalVisible(false);
                }}
                style={{
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  backgroundColor: selectedStatus === status.key ? theme.primary : theme.surface,
                  borderRadius: radii.md,
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ color: selectedStatus === status.key ? '#FFF' : theme.textPrimary }}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: theme.border }}
            >
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>{t('common.close') || 'Закрыть'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}