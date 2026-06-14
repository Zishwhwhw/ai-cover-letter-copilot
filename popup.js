document.addEventListener('DOMContentLoaded', () => {
    const setupCard = document.getElementById('setupCard');
    const mainCard = document.getElementById('mainCard');
    const apiKeyInput = document.getElementById('apiKey');
    const userBioInput = document.getElementById('userBio');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const generateBtn = document.getElementById('generateBtn');
    const loading = document.getElementById('loading');
    const resultBox = document.getElementById('resultBox');
    const copyBtn = document.getElementById('copyBtn');
    const editBioBtn = document.getElementById('editBioBtn');

    // Load settings
    chrome.storage.local.get(['geminiApiKey', 'userBio'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
            if (result.userBio) userBioInput.value = result.userBio;
            setupCard.classList.add('hidden');
            mainCard.classList.remove('hidden');
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        const bio = userBioInput.value.trim();
        if (key && bio) {
            chrome.storage.local.set({ geminiApiKey: key, userBio: bio }, () => {
                setupCard.classList.add('hidden');
                mainCard.classList.remove('hidden');
            });
        } else {
            alert("Please enter both API key and a short bio.");
        }
    });

    editBioBtn.addEventListener('click', () => {
        setupCard.classList.remove('hidden');
        mainCard.classList.add('hidden');
    });

    generateBtn.addEventListener('click', async () => {
        resultBox.classList.add('hidden');
        copyBtn.classList.add('hidden');
        loading.classList.remove('hidden');

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes("upwork.com")) {
            alert("Please open an Upwork job posting first!");
            loading.classList.add('hidden');
            return;
        }

        chrome.tabs.sendMessage(tab.id, { action: "getJobDesc" }, (response) => {
            if (response && response.jobText) {
                generateCoverLetter(response.jobText);
            } else {
                alert("Could not find the job description on screen.");
                loading.classList.add('hidden');
            }
        });
    });

    async function generateCoverLetter(jobText) {
        chrome.storage.local.get(['geminiApiKey', 'userBio'], async (result) => {
            const apiKey = result.geminiApiKey;
            const bio = result.userBio;
            
            const prompt = `You are an expert freelance copywriter. Write a highly converting Upwork cover letter for the following job description. 
Use the freelancer's bio to highlight relevant skills. Keep it concise, friendly, and professional (max 3 short paragraphs). Do not use generic buzzwords.
            
FREELANCER BIO:
${bio}

JOB DESCRIPTION:
${jobText}`;
            
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                
                const data = await response.json();
                const letter = data.candidates[0].content.parts[0].text;
                
                loading.classList.add('hidden');
                resultBox.value = letter;
                resultBox.classList.remove('hidden');
                copyBtn.classList.remove('hidden');
            } catch (err) {
                alert("Error calling API. Check your key.");
                loading.classList.add('hidden');
            }
        });
    }

    copyBtn.addEventListener('click', () => {
        resultBox.select();
        document.execCommand('copy');
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = "Copy to Clipboard", 2000);
    });
});