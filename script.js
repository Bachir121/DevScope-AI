document.getElementById('ai-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const idea = document.getElementById('projectIdea').value;
  const res = await fetch('https://devscope-ai.onrender.com/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea })
  });
  const data = await res.json();
  if (data.result && typeof data.result === 'object') {
    document.getElementById('output').innerHTML = `
      <h2>Project Scope</h2>
      <b>Description:</b> ${data.result.description}<br>
      <b>Target Users:</b> ${data.result.targetUsers}<br>
      <b>Key Features:</b> <ul>${data.result.keyFeatures.map(f => `<li>${f}</li>`).join('')}</ul>
      <b>Suggested Technologies:</b> <ul>${data.result.suggestedTechnologies.map(t => `<li>${t}</li>`).join('')}</ul>
      <b>Summary:</b> ${data.result.summary}
    `;
  } else {
    document.getElementById('output').innerText = data.result || 'No result.';
  }
});