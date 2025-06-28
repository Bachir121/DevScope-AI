document.getElementById('ai-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const idea = document.getElementById('projectIdea').value;
  document.getElementById('output').innerText = 'Generating legal document...';
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea })
    });
    const data = await res.json();
    if (data.result) {
      document.getElementById('output').innerHTML = `<pre>${data.result}</pre><button id='download-pdf'>Download as PDF</button>`;
      document.getElementById('download-pdf').onclick = async () => {
        const pdfRes = await fetch('/api/contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractText: data.result })
        });
        const blob = await pdfRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contract.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      };
    } else {
      document.getElementById('output').innerText = data.error || 'No result.';
    }
  } catch (err) {
    document.getElementById('output').innerText = 'Error: ' + err.message;
  }
});

// Subscription, Admin, and Login stubs
window.subscribe = () => alert('Subscription system coming soon!');
window.viewSubscriptions = () => alert('Admin dashboard coming soon!');
window.emailLogin = () => alert('Email login coming soon!');
