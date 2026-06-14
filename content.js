chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getJobDesc") {
        // Upwork uses different classes for job descriptions, try common ones
        const jobElements = document.querySelectorAll('.job-description, [data-test="job-description-text"], .cfe-ui-job-description');
        
        let jobText = "";
        if (jobElements.length > 0) {
            jobText = jobElements[0].innerText;
        } else {
            // Fallback: just grab the main body or article
            const article = document.querySelector('article');
            if (article) jobText = article.innerText;
            else jobText = document.body.innerText.substring(0, 3000); // safety fallback
        }
        
        sendResponse({ jobText: jobText });
    }
    return true;
});
