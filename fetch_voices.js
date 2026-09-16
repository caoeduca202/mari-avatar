const fs = require('fs');

async function getVoices() {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': 'sk_868b6692e6e08d3dbaf2cf89b409cc60f2117ce0b8f032b5' }
  });
  const data = await response.json();
  
  const femaleVoices = data.voices.filter(v => v.labels?.gender === 'female' || v.category === 'premade');
  
  const voicesList = femaleVoices.map(v => ({
    name: v.name,
    id: v.voice_id,
    labels: v.labels
  }));
  
  fs.writeFileSync('voices.json', JSON.stringify(voicesList, null, 2));
}

getVoices().catch(console.error);
