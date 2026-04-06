// script.js function startCheck() { document.getElementById('checker').classList.remove('hidden'); }

function analyzeSymptom() { const symptom = document.getElementById('symptom').value.toLowerCase(); let result = '';

if (symptom.includes('fever')) { result = 'You may have an infection. Stay hydrated and consult a doctor.'; } else if (symptom.includes('headache')) { result = 'Possible stress or dehydration. Rest and drink water.'; } else { result = 'Symptom not recognized. Please consult a professional.'; }

document.getElementById('result').textContent = result;
}