// src/pages/auth/PatientRegistrationFlow.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import patientService from '@/services/patientService';
import { Gender, BloodType, MaritalStatus } from '@/enums';
import type { Patient } from '@/models/Patient';

const PatientRegistrationFlow: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [patientExists, setPatientExists] = useState(false);

  // Check if patient already exists
  useEffect(() => {
    const checkExistingPatient = async () => {
      if (!user) return;
      
      try {
        const exists = await patientService.patientExists(user.userId);
        setPatientExists(exists);
      } catch (err) {
        console.error('Error checking patient existence:', err);
      } finally {
        setChecking(false);
      }
    };

    checkExistingPatient();
  }, [user]);

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    maritalStatus: '',
    occupation: '',
    nationality: '',
  });

  // Contact Information State
  const [contactInfo, setContactInfo] = useState({
    primaryPhone: '',
    secondaryPhone: '',
    email: user?.email || '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  // Emergency Contact State
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
  });

  // Medical Information State (all optional)
  const [medicalInfo, setMedicalInfo] = useState({
    pastMedicalHistory: '',
    pastSurgicalHistory: '',
    allergies: '',
    familyHistory: '',
    currentMedications: '',
    otherRelevantHistory: '',
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading..." />
      </div>
    );
  }

  // If patient already exists, show pending approval message
  if (patientExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-lg p-6 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Registration Complete
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your registration has been submitted successfully.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account is pending admin approval. Please wait for approval before accessing the system.
          </p>
          <Button onClick={() => navigate('/login')}>Back to Login</Button>
        </Card>
      </div>
    );
  }

  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactInfoChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setContactInfo((prev) => ({
        ...prev,
        [parent]: { ...prev[parent as keyof typeof prev], [child]: value },
      }));
    } else {
      setContactInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setEmergencyContact((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedicalInfoChange = (field: string, value: string) => {
    setMedicalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    if (!personalInfo.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!personalInfo.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!personalInfo.dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }
    if (!personalInfo.gender) {
      setError('Gender is required');
      return false;
    }
    if (!contactInfo.primaryPhone.trim()) {
      setError('Primary phone is required');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      if (!validateStep1()) return;
    }
    setStep((s) => s + 1);
    setError(null);
  };

  const handlePrevious = () => {
    setStep((s) => s - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Convert form data to Patient model
      const patientData: Omit<Patient, 'patientId' | 'userId' | 'createdAt' | 'updatedAt'> = {
        personalInfo: {
          firstName: personalInfo.firstName.trim(),
          lastName: personalInfo.lastName.trim(),
          middleName: personalInfo.middleName.trim() || undefined,
          dateOfBirth: new Date(personalInfo.dateOfBirth),
          gender: personalInfo.gender as Gender,
          bloodType: personalInfo.bloodType ? (personalInfo.bloodType as BloodType) : undefined,
          maritalStatus: personalInfo.maritalStatus
            ? (personalInfo.maritalStatus as MaritalStatus)
            : undefined,
          occupation: personalInfo.occupation.trim() || undefined,
          nationality: personalInfo.nationality.trim() || undefined,
        },
        contactInfo: {
          primaryPhone: contactInfo.primaryPhone.trim(),
          secondaryPhone: contactInfo.secondaryPhone.trim() || undefined,
          email: contactInfo.email.trim() || undefined,
          address: contactInfo.address.street.trim()
            ? {
                street: contactInfo.address.street.trim(),
                city: contactInfo.address.city.trim(),
                state: contactInfo.address.state.trim(),
                zipCode: contactInfo.address.zipCode.trim(),
                country: contactInfo.address.country.trim(),
              }
            : undefined,
        },
        emergencyContact:
          emergencyContact.name.trim() || emergencyContact.phone.trim()
            ? {
                name: emergencyContact.name.trim(),
                relationship: emergencyContact.relationship.trim(),
                phone: emergencyContact.phone.trim(),
              }
            : undefined,
        medicalInfo: {
          allergies: medicalInfo.allergies.trim()
            ? medicalInfo.allergies
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean)
                .map((name) => ({
                  name,
                  severity: 'mild' as const,
                }))
            : [],
          currentMedications: medicalInfo.currentMedications.trim()
            ? medicalInfo.currentMedications
                .split(',')
                .map((m) => m.trim())
                .filter(Boolean)
            : [],
          medicalHistory: medicalInfo.pastMedicalHistory.trim()
            ? medicalInfo.pastMedicalHistory
                .split(',')
                .map((h) => h.trim())
                .filter(Boolean)
            : [],
          surgicalHistory: medicalInfo.pastSurgicalHistory.trim()
            ? medicalInfo.pastSurgicalHistory
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          familyHistory: medicalInfo.familyHistory.trim()
            ? medicalInfo.familyHistory
                .split(',')
                .map((f) => f.trim())
                .filter(Boolean)
            : [],
          socialHistory: {},
        },
        isActive: true,
        createdBy: user.userId,
      };

      await patientService.createPatient(user.userId, patientData);
      
      // Show success message and redirect
      alert('Registration submitted successfully! Your account is pending admin approval.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 0: Personal Information
    <div key="personal" className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
      <Input
        label="First Name"
        value={personalInfo.firstName}
        onChange={(value) => handlePersonalInfoChange('firstName', value)}
        required
      />
      <Input
        label="Last Name"
        value={personalInfo.lastName}
        onChange={(value) => handlePersonalInfoChange('lastName', value)}
        required
      />
      <Input
        label="Middle Name (Optional)"
        value={personalInfo.middleName}
        onChange={(value) => handlePersonalInfoChange('middleName', value)}
      />
      <Input
        label="Date of Birth"
        type="date"
        value={personalInfo.dateOfBirth}
        onChange={(value) => handlePersonalInfoChange('dateOfBirth', value)}
        required
      />
      <Input
        label="Gender"
        type="select"
        value={personalInfo.gender}
        onChange={(value) => handlePersonalInfoChange('gender', value)}
        options={Object.values(Gender)}
        required
      />
      <Input
        label="Blood Type (Optional)"
        type="select"
        value={personalInfo.bloodType}
        onChange={(value) => handlePersonalInfoChange('bloodType', value)}
        options={Object.values(BloodType)}
      />
      <Input
        label="Marital Status (Optional)"
        type="select"
        value={personalInfo.maritalStatus}
        onChange={(value) => handlePersonalInfoChange('maritalStatus', value)}
        options={Object.values(MaritalStatus)}
      />
      <Input
        label="Occupation (Optional)"
        value={personalInfo.occupation}
        onChange={(value) => handlePersonalInfoChange('occupation', value)}
      />
      <Input
        label="Nationality (Optional)"
        value={personalInfo.nationality}
        onChange={(value) => handlePersonalInfoChange('nationality', value)}
      />
    </div>,

    // Step 1: Contact Information
    <div key="contact" className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
      <Input
        label="Primary Phone"
        value={contactInfo.primaryPhone}
        onChange={(value) => handleContactInfoChange('primaryPhone', value)}
        required
      />
      <Input
        label="Secondary Phone (Optional)"
        value={contactInfo.secondaryPhone}
        onChange={(value) => handleContactInfoChange('secondaryPhone', value)}
      />
      <Input
        label="Email"
        type="email"
        value={contactInfo.email}
        onChange={(value) => handleContactInfoChange('email', value)}
      />
      <Input
        label="Street Address (Optional)"
        value={contactInfo.address.street}
        onChange={(value) => handleContactInfoChange('address.street', value)}
      />
      <Input
        label="City (Optional)"
        value={contactInfo.address.city}
        onChange={(value) => handleContactInfoChange('address.city', value)}
      />
      <Input
        label="State (Optional)"
        value={contactInfo.address.state}
        onChange={(value) => handleContactInfoChange('address.state', value)}
      />
      <Input
        label="Zip Code (Optional)"
        value={contactInfo.address.zipCode}
        onChange={(value) => handleContactInfoChange('address.zipCode', value)}
      />
      <Input
        label="Country (Optional)"
        value={contactInfo.address.country}
        onChange={(value) => handleContactInfoChange('address.country', value)}
      />
      <h3 className="text-lg font-semibold mt-6 mb-2">Emergency Contact (Optional)</h3>
      <Input
        label="Name"
        value={emergencyContact.name}
        onChange={(value) => handleEmergencyContactChange('name', value)}
      />
      <Input
        label="Relationship"
        value={emergencyContact.relationship}
        onChange={(value) => handleEmergencyContactChange('relationship', value)}
      />
      <Input
        label="Phone"
        value={emergencyContact.phone}
        onChange={(value) => handleEmergencyContactChange('phone', value)}
      />
    </div>,

    // Step 2: Medical Information (All Optional)
    <div key="medical" className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Medical Information</h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        All fields below are optional. Please provide any relevant medical information.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">
            Past Medical History
            <span className="text-xs text-gray-500 block font-normal mt-1">
              List any past or current medical conditions (e.g., Diabetes, Hypertension, Asthma).
              Separate multiple conditions with commas.
            </span>
          </label>
          <textarea
            value={medicalInfo.pastMedicalHistory}
            onChange={(e) => handleMedicalInfoChange('pastMedicalHistory', e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring border-gray-300 min-h-[100px]"
            placeholder="e.g., Diabetes Type 2, Hypertension"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Past Surgical History
            <span className="text-xs text-gray-500 block font-normal mt-1">
              List any past surgeries or procedures you have undergone. Include the date if known.
              Separate multiple entries with commas.
            </span>
          </label>
          <textarea
            value={medicalInfo.pastSurgicalHistory}
            onChange={(e) => handleMedicalInfoChange('pastSurgicalHistory', e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring border-gray-300 min-h-[100px]"
            placeholder="e.g., Appendectomy (2010), Knee Surgery (2015)"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Allergies
            <span className="text-xs text-gray-500 block font-normal mt-1">
              List any known allergies (medications, food, environmental, etc.). Include the
              severity if known. Separate multiple allergies with commas.
            </span>
          </label>
          <textarea
            value={medicalInfo.allergies}
            onChange={(e) => handleMedicalInfoChange('allergies', e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring border-gray-300 min-h-[100px]"
            placeholder="e.g., Penicillin (severe), Peanuts (moderate)"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Family History
            <span className="text-xs text-gray-500 block font-normal mt-1">
              List any medical conditions that run in your family (e.g., Heart disease, Diabetes,
              Cancer). Include the relation if known. Separate multiple entries with commas.
            </span>
          </label>
          <textarea
            value={medicalInfo.familyHistory}
            onChange={(e) => handleMedicalInfoChange('familyHistory', e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring border-gray-300 min-h-[100px]"
            placeholder="e.g., Heart disease (Father), Diabetes (Mother)"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Current Medications
            <span className="text-xs text-gray-500 block font-normal mt-1">
              List all medications you are currently taking, including dosage if known. Separate
              multiple medications with commas.
            </span>
          </label>
          <textarea
            value={medicalInfo.currentMedications}
            onChange={(e) => handleMedicalInfoChange('currentMedications', e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring border-gray-300 min-h-[100px]"
            placeholder="e.g., Metformin 500mg twice daily, Lisinopril 10mg once daily"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Any Other Relevant History
            <span className="text-xs text-gray-500 block font-normal mt-1">
              Include any other relevant medical information, lifestyle factors, or health concerns
              that may be important for your care.
            </span>
          </label>
          <textarea
            value={medicalInfo.otherRelevantHistory}
            onChange={(e) => handleMedicalInfoChange('otherRelevantHistory', e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring border-gray-300 min-h-[100px]"
            placeholder="e.g., Smoking history, exercise habits, dietary restrictions"
          />
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl p-6 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Patient Registration
          </h1>
          <div className="flex items-center space-x-2 mb-4">
            {[0, 1, 2].map((index) => (
              <React.Fragment key={index}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === index
                      ? 'bg-blue-600 text-white'
                      : step > index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-1 ${
                      step > index ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">{steps[step]}</div>

        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={step === 0 || loading}
            variant="secondary"
          >
            Previous
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={loading}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <Loading size={20} className="mr-2" />
                  Submitting...
                </span>
              ) : (
                'Submit'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PatientRegistrationFlow;

