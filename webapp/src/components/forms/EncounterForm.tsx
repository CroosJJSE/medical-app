// src/components/forms/EncounterForm.tsx
import React, { useState } from 'react';
import { Encounter } from '@/models/Encounter';
import { EncounterType } from '@/enums';
import { createEncounter, saveDraft } from '@/services/encounterService';
import Button from '../common/Button';
import Input from '../common/Input';

interface EncounterFormProps {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  onSuccess?: () => void;
}

const EncounterForm: React.FC<EncounterFormProps> = ({ patientId, doctorId, appointmentId, onSuccess }) => {
  const [encounterData, setEncounterData] = useState<Partial<Encounter>>({
    patientId,
    doctorId,
    appointmentId,
    encounterType: EncounterType.INITIAL,
    subjective: {
      chiefComplaint: '',
    },
    objective: {},
    assessment: {},
    plan: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDirectChange = (field: keyof Encounter, value: any) => {
    setEncounterData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (section: 'subjective' | 'objective' | 'assessment' | 'plan', field: string, value: any) => {
    setEncounterData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value },
    }));
  };

  const handleSubmit = async (draft = false) => {
    setLoading(true);
    setError(null);
    try {
      if (draft) {
        await saveDraft(encounterData as Encounter);
      } else {
        await createEncounter(encounterData as Encounter);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save encounter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4">
      <Input label="Encounter Type" type="select" value={encounterData.encounterType || EncounterType.INITIAL} onChange={(value) => handleDirectChange('encounterType', value as EncounterType)} options={Object.values(EncounterType)} />

      <h3>Subjective</h3>
      <Input label="Chief Complaint" value={encounterData.subjective?.chiefComplaint || ''} onChange={(value) => handleNestedChange('subjective', 'chiefComplaint', value)} />
      <Input label="History of Presenting Complaint" value={encounterData.subjective?.historyOfPresentingComplaint || ''} onChange={(value) => handleNestedChange('subjective', 'historyOfPresentingComplaint', value)} />

      <h3>Objective</h3>
      <Input 
        label="Vital Signs (JSON)" 
        value={JSON.stringify(encounterData.objective?.vitalSigns || {})} 
        onChange={(value) => {
          try {
            const parsed = JSON.parse(value);
            handleNestedChange('objective', 'vitalSigns', parsed);
          } catch (err) {
            setError('Invalid JSON format for vital signs');
          }
        }} 
      />

      <h3>Assessment</h3>
      <Input label="Problems" value={(encounterData.assessment?.problems || []).join(', ')} onChange={(value) => handleNestedChange('assessment', 'problems', value.split(',').map((s) => s.trim()))} />

      <h3>Plan</h3>
      <Input label="Treatment Plan" value={encounterData.plan?.treatmentPlan || ''} onChange={(value) => handleNestedChange('plan', 'treatmentPlan', value)} />

      {error && <p className="text-red-500">{error}</p>}
      <div className="flex space-x-2">
        <Button onClick={() => handleSubmit(true)} disabled={loading}>Save Draft</Button>
        <Button onClick={() => handleSubmit(false)} disabled={loading}>Finalize</Button>
      </div>
    </form>
  );
};

export default EncounterForm;
