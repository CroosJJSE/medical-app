// src/services/prescriptionPdfService.ts
// Service for generating prescription PDFs

import jsPDF from 'jspdf';
import type { Encounter } from '@/models/Encounter';
import type { Patient } from '@/models/Patient';
import type { Doctor } from '@/models/Doctor';

/**
 * Generate a prescription PDF as a Blob
 * @param encounter - Encounter data
 * @param patient - Patient information
 * @param doctor - Doctor information
 * @returns PDF Blob
 */
export async function generatePrescriptionPdf(
  encounter: Encounter,
  patient: Patient,
  doctor: Doctor
): Promise<Blob> {
  const doc = new jsPDF();
  
  // Set up fonts and margins
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPos = margin;
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESCRIPTION', pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight;
  
  const clinicName = doctor.practiceInfo?.clinicName || 'Medical Clinic';
  const clinicAddress = doctor.practiceInfo?.clinicAddress || '';
  const clinicPhone = doctor.contactInfo?.primaryPhone || '';
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(clinicName, pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight;
  
  if (clinicAddress) {
    doc.setFontSize(10);
    doc.text(clinicAddress, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight;
  }
  
  if (clinicPhone) {
    doc.setFontSize(10);
    doc.text(`Phone: ${clinicPhone}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight * 2;
  }
  
  // Draw line
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += lineHeight;
  
  // Patient Information
  const patientName = patient.personalInfo 
    ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
    : patient.displayName || 'N/A';
  
  const patientAge = patient.personalInfo?.dateOfBirth
    ? calculateAge(patient.personalInfo.dateOfBirth)
    : 'N/A';
  
  const patientGender = patient.personalInfo?.gender || 'N/A';
  const patientPhone = patient.contactInfo?.primaryPhone || 'N/A';
  
  const encounterDate = new Date(encounter.encounterDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', margin, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patientName}`, margin, yPos);
  doc.text(`Date: ${encounterDate}`, pageWidth - margin - 40, yPos, { align: 'right' });
  yPos += lineHeight;
  
  doc.text(`Age: ${patientAge} years | Gender: ${patientGender}`, margin, yPos);
  yPos += lineHeight;
  
  doc.text(`Phone: ${patientPhone}`, margin, yPos);
  doc.text(`Patient ID: ${patient.userID || 'N/A'}`, pageWidth - margin - 40, yPos, { align: 'right' });
  yPos += lineHeight * 2;
  
  // Chief Complaint
  const chiefComplaint = encounter.subjective?.chiefComplaint || 'N/A';
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Chief Complaint', margin, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const complaintLines = doc.splitTextToSize(chiefComplaint, pageWidth - 2 * margin);
  doc.text(complaintLines, margin, yPos);
  yPos += complaintLines.length * lineHeight + lineHeight;
  
  // Diagnosis
  const diagnosis = encounter.assessment?.differentialDiagnosis?.join(', ') || 
                   encounter.assessment?.icd10Codes?.join(', ') || 
                   'N/A';
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnosis', margin, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const diagnosisLines = doc.splitTextToSize(diagnosis, pageWidth - 2 * margin);
  doc.text(diagnosisLines, margin, yPos);
  yPos += diagnosisLines.length * lineHeight + lineHeight;
  
  // Prescription
  const medications = encounter.plan?.medications || [];
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Prescription', margin, yPos);
  yPos += lineHeight;
  
  if (medications.length > 0) {
    // Table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('No.', margin, yPos);
    doc.text('Medication', margin + 15, yPos);
    doc.text('Dosage & Frequency', margin + 80, yPos);
    yPos += lineHeight;
    
    doc.setLineWidth(0.3);
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    yPos += 2;
    
    // Medications
    doc.setFont('helvetica', 'normal');
    medications.forEach((med, index) => {
      if (yPos > pageHeight - margin - 20) {
        doc.addPage();
        yPos = margin;
      }
      
      const medParts = med.split(' ');
      const medName = medParts[0] || med;
      const dosage = med.substring(med.indexOf(' ') + 1) || 'As directed';
      
      doc.text(`${index + 1}.`, margin, yPos);
      doc.text(medName, margin + 15, yPos);
      
      const dosageLines = doc.splitTextToSize(dosage, pageWidth - margin - 100);
      doc.text(dosageLines, margin + 80, yPos);
      yPos += Math.max(lineHeight, dosageLines.length * lineHeight);
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No medications prescribed.', margin, yPos);
    yPos += lineHeight;
  }
  
  yPos += lineHeight;
  
  // Treatment Plan
  if (encounter.plan?.treatmentPlan) {
    if (yPos > pageHeight - margin - 30) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Treatment Plan', margin, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const planLines = doc.splitTextToSize(encounter.plan.treatmentPlan, pageWidth - 2 * margin);
    doc.text(planLines, margin, yPos);
    yPos += planLines.length * lineHeight + lineHeight;
  }
  
  // Follow-up
  const followUp = encounter.plan?.followUp;
  if (followUp) {
    if (yPos > pageHeight - margin - 30) {
      doc.addPage();
      yPos = margin;
    }
    
    const followUpDate = new Date(followUp.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Follow-up', margin, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${followUpDate}${followUp.time ? ` at ${followUp.time}` : ''}`, margin, yPos);
    yPos += lineHeight;
    
    if (followUp.notes) {
      const notesLines = doc.splitTextToSize(`Notes: ${followUp.notes}`, pageWidth - 2 * margin);
      doc.text(notesLines, margin, yPos);
      yPos += notesLines.length * lineHeight;
    }
  }
  
  // Footer with doctor signature
  const doctorName = doctor.professionalInfo
    ? `${doctor.professionalInfo.title || 'Dr.'} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`
    : doctor.displayName || 'N/A';
  
  const doctorQualification = doctor.professionalInfo?.qualifications?.[0] || '';
  const doctorLicense = doctor.professionalInfo?.licenseNumber || '';
  
  // Move to bottom of page
  yPos = pageHeight - margin - 40;
  
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(doctorName, pageWidth - margin - 30, yPos, { align: 'center' });
  yPos += lineHeight;
  
  if (doctorQualification) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(doctorQualification, pageWidth - margin - 30, yPos, { align: 'center' });
    yPos += lineHeight;
  }
  
  if (doctorLicense) {
    doc.setFontSize(9);
    doc.text(`License: ${doctorLicense}`, pageWidth - margin - 30, yPos, { align: 'center' });
  }
  
  // Generate PDF blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date | string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Legacy HTML generation functions (not used, but kept for reference)
function generatePrescriptionHtml(
  encounter: Encounter,
  patient: Patient,
  doctor: Doctor
): string {
  const patientName = patient.personalInfo 
    ? `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
    : patient.displayName || 'N/A';
  
  const patientAge = patient.personalInfo?.dateOfBirth
    ? calculateAge(patient.personalInfo.dateOfBirth)
    : 'N/A';
  
  const patientGender = patient.personalInfo?.gender || 'N/A';
  const patientPhone = patient.contactInfo?.primaryPhone || 'N/A';
  
  const doctorName = doctor.professionalInfo
    ? `${doctor.professionalInfo.title || 'Dr.'} ${doctor.professionalInfo.firstName} ${doctor.professionalInfo.lastName}`
    : doctor.displayName || 'N/A';
  
  const doctorQualification = doctor.professionalInfo?.qualifications?.[0] || '';
  const doctorLicense = doctor.professionalInfo?.licenseNumber || '';
  const clinicName = doctor.practiceInfo?.clinicName || '';
  const clinicAddress = doctor.practiceInfo?.clinicAddress || '';
  const clinicPhone = doctor.contactInfo?.primaryPhone || '';
  
  const encounterDate = new Date(encounter.encounterDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const chiefComplaint = encounter.subjective?.chiefComplaint || 'N/A';
  const diagnosis = encounter.assessment?.differentialDiagnosis?.join(', ') || 
                   encounter.assessment?.icd10Codes?.join(', ') || 
                   'N/A';
  
  const medications = encounter.plan?.medications || [];
  
  const followUp = encounter.plan?.followUp;
  const followUpDate = followUp 
    ? new Date(followUp.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;
  const followUpTime = followUp?.time || null;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Prescription - ${patientName}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24pt;
      font-weight: bold;
    }
    .header p {
      margin: 5px 0;
      font-size: 10pt;
    }
    .section {
      margin: 15px 0;
    }
    .section-title {
      font-weight: bold;
      font-size: 14pt;
      margin-bottom: 10px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    .patient-info, .doctor-info {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .info-column {
      flex: 1;
    }
    .info-label {
      font-weight: bold;
      margin-right: 10px;
    }
    .medications-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .medications-table th,
    .medications-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    .medications-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      text-align: right;
      border-top: 1px solid #000;
      padding-top: 10px;
    }
    .signature-line {
      margin-top: 50px;
      border-top: 1px solid #000;
      width: 200px;
      margin-left: auto;
    }
    .date {
      text-align: right;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PRESCRIPTION</h1>
    <p>${clinicName || 'Medical Clinic'}</p>
    ${clinicAddress ? `<p>${clinicAddress}</p>` : ''}
    ${clinicPhone ? `<p>Phone: ${clinicPhone}</p>` : ''}
  </div>

  <div class="section">
    <div class="patient-info">
      <div class="info-column">
        <p><span class="info-label">Patient Name:</span> ${patientName}</p>
        <p><span class="info-label">Age:</span> ${patientAge} years</p>
        <p><span class="info-label">Gender:</span> ${patientGender}</p>
        <p><span class="info-label">Phone:</span> ${patientPhone}</p>
      </div>
      <div class="info-column">
        <p><span class="info-label">Date:</span> ${encounterDate}</p>
        <p><span class="info-label">Patient ID:</span> ${patient.userID || 'N/A'}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Chief Complaint</div>
    <p>${chiefComplaint}</p>
  </div>

  <div class="section">
    <div class="section-title">Diagnosis</div>
    <p>${diagnosis}</p>
  </div>

  <div class="section">
    <div class="section-title">Prescription</div>
    ${medications.length > 0 ? `
      <table class="medications-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Medication</th>
            <th>Dosage & Frequency</th>
          </tr>
        </thead>
        <tbody>
          ${medications.map((med, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${med.split(' ')[0] || med}</td>
              <td>${med.substring(med.indexOf(' ') + 1) || 'As directed'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p>No medications prescribed.</p>'}
  </div>

  ${encounter.plan?.treatmentPlan ? `
    <div class="section">
      <div class="section-title">Treatment Plan</div>
      <p>${encounter.plan.treatmentPlan}</p>
    </div>
  ` : ''}

  ${followUpDate ? `
    <div class="section">
      <div class="section-title">Follow-up</div>
      <p>Date: ${followUpDate}${followUpTime ? ` at ${followUpTime}` : ''}</p>
      ${followUp?.notes ? `<p>Notes: ${followUp.notes}</p>` : ''}
    </div>
  ` : ''}

  <div class="footer">
    <div class="signature-line"></div>
    <p style="margin-top: 5px;"><strong>${doctorName}</strong></p>
    ${doctorQualification ? `<p>${doctorQualification}</p>` : ''}
    ${doctorLicense ? `<p>License: ${doctorLicense}</p>` : ''}
  </div>

  <div class="date">
    <p>Date: ${encounterDate}</p>
  </div>
</body>
</html>
  `.trim();
}

