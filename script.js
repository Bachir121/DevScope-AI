document.getElementById('ai-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const idea = document.getElementById('projectIdea').value;
  const res = await fetch('https://devscope-ai.onrender.com/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea })
  });
  const data = await res.json();
  document.getElementById('output').innerText = data.result;
});
