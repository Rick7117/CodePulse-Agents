document.getElementById('search-button').addEventListener('click', async () => {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = 'Searching...';
    document.getElementById('process-button').style.display = 'none';
    document.getElementById('final-output').innerHTML = '';

    try {
        // Call the backend API to search for projects
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const results = data.results || []; // Ensure results is an array

        resultsContainer.innerHTML = ''; // Clear 'Searching...'
        if (results.length > 0) {
            results.forEach(project => {
                const card = document.createElement('div');
                card.classList.add('project-card');
        card.innerHTML = `
            <input type="checkbox" class="project-checkbox">
            <div class="project-details-wrapper"> <!-- New wrapper div -->
                <div class="project-info-about-wrapper"> <!-- New wrapper for info and about -->
                    <div class="project-info">
                        <h3><a href="${project.link}" target="_blank">${project.title || 'No title available'}</a></h3>
                    </div>
                    <div class="project-about">${project.about || 'No descirption'}</div>
                </div>
                <div class="project-stats">
                    <p>
                        <span style="display: flex; align-items: center; gap: 6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path></svg> Stars ${project.stars || 0}
                        </span>
                        <span style="display: flex; align-items: center; gap: 6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg> Forks ${project.forks || 0}
                        </span>
                        <span style="display: flex; align-items: center; gap: 6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"></path></svg> Watchers ${project.watchers || 0}
                        </span>
                    </p>
                </div>
            </div>
        `;
                resultsContainer.appendChild(card);
            });
            document.getElementById('process-button').style.display = 'block';

            // Add event listeners to newly created project cards
            addProjectCardEventListeners();

        } else {
            resultsContainer.innerHTML = 'No results found.';
        }


    } catch (error) {
        // Display a more specific error message if available, otherwise use a generic one.
        resultsContainer.innerHTML = `Error searching projects: ${error.message || 'An unknown error occurred.'}`;
        console.error('Search error:', error);
    }
});

document.getElementById('search-input').addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission if any
        document.getElementById('search-button').click(); // Trigger the search button click
    }
});

// Function to add click listeners to project cards
function addProjectCardEventListeners() {
    let selectedProjectCard = null; // Keep track of the currently selected card

    document.querySelectorAll('.project-card').forEach(card => {
        // Add click listener to the card for showing details and toggling checkbox
        card.addEventListener('click', async (event) => {
            // Prevent clicking the stats from triggering the card click
            if (event.target.closest('.project-stats')) {
                return;
            }

            // Toggle the checkbox state
            const checkbox = card.querySelector('.project-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                // Manually trigger the change event to update Star History if needed
                // const changeEvent = new Event('change');
                // checkbox.dispatchEvent(changeEvent);
            }

            // Remove 'selected' class from the previously selected card
            if (selectedProjectCard) {
                selectedProjectCard.classList.remove('selected');
            }

            // Add 'selected' class to the clicked card
            card.classList.add('selected');
            selectedProjectCard = card; // Update the selected card

            const projectLinkElement = card.querySelector('.project-info a');
            const projectTitleElement = card.querySelector('.project-info h3 a'); // Get the title element
            if (!projectLinkElement || !projectTitleElement) { // Check both elements
                console.error('Project link or title element not found in card:', card);
                const detailsContent = document.getElementById('project-details-content');
                if (detailsContent) {
                    detailsContent.innerHTML = 'Error: Could not find project link or title in the card.';
                }
                return;
            }
            const projectTitle = projectTitleElement.textContent; // Get the title text

            // Get the current search query from the input field
            const currentQuery = document.getElementById('search-input').value; // Added to get query

            const detailsContent = document.getElementById('project-details-content');
            if (detailsContent) {
                // Fetch project details from the backend
                try {
                    const response = await fetch('/project_details', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: projectTitle, query: currentQuery }) // Include query in the body
                    });

                    if (!response.ok) {
                        let errorData;
                        try {
                            errorData = await response.json();
                        } catch (e) {
                            // If response is not JSON, use text
                            const errorText = await response.text();
                            throw new Error(errorText || `HTTP error! status: ${response.status}`);
                        }
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }

                    const projectDetails = await response.json();

                    // Update the details panel with fetched data
                    // Use marked.js to parse Markdown content to HTML
                    const htmlContent = marked.parse(projectDetails.content || 'No content available'); // Parse Markdown

                    // Generate language bar and legend
                    let languageHtml = '';
                    const languages = projectDetails.language; // Get language data
                    console.log('Languages data:', languages);
                    if (languages && Object.keys(languages).length > 0) {
                        languageHtml += '<div class="language-container">';
                        // Calculate total bytes
                        const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
                        languageHtml += '<div class="language-bar">';
                        // Sort languages by percentage descending for consistent display
                        const sortedLanguages = Object.entries(languages)
                            .map(([lang, bytes]) => [lang, (bytes / totalBytes) * 100]) // Calculate percentage
                            .sort(([, a], [, b]) => b - a);
                        sortedLanguages.forEach(([lang, percentage]) => {
                            // Assign a color (simple example, could use a color map)
                            // Re-calculate color based on language name or a fixed map for consistency
                            // For simplicity, let's use a basic index-based color for this example, assuming order is stable
                            const index = sortedLanguages.findIndex(([l, p]) => l === lang && p === percentage);
                            const consistentColor = `hsl(${(index * 100) % 360}, 70%, 50%)`;
                            languageHtml += `<div class="language-segment" style="width: ${percentage}%; background-color: ${consistentColor};" title="${lang}: ${percentage.toFixed(2)}%"></div>`;
                        });
                        languageHtml += '</div>'; // .language-bar
                        languageHtml += '<div class="language-legend">';
                        sortedLanguages.forEach(([lang, percentage]) => {
                             // Use the same consistent color calculation as for the bar segments
                             const index = sortedLanguages.findIndex(([l, p]) => l === lang && p === percentage);
                             const consistentColor = `hsl(${(index * 100) % 360}, 70%, 50%)`;
                             languageHtml += `<span class="legend-item"><span class="legend-color" style="background-color: ${consistentColor};"></span>${lang} ${percentage.toFixed(2)}%</span>`;
                        });
                        languageHtml += '</div>'; // .language-legend
                        languageHtml += '</div>'; // .language-container
                    }

                    detailsContent.innerHTML = `
                        ${languageHtml} <!-- Add language visualization -->
                        <p>${htmlContent}</p> <!-- Use parsed HTML content -->`;

                     // Insert languageHtml after the title
                     // const rightPanelTitle = document.querySelector('#right-panel h2');
                } catch (error) {
                    detailsContent.innerHTML = `Error loading project details: ${error.message || 'An unknown error occurred.'}`;
                    console.error('Project details fetch error:', error);
                }
            }
        });

        // Add mouseover and mouseout listeners to the project stats for Star History
        const projectStats = card.querySelector('.project-stats');
        if (projectStats) {
            projectStats.addEventListener('mouseover', (event) => {
                const projectLinkElement = card.querySelector('.project-info a');
                if (projectLinkElement) {
                    // Add the current project to the Star History chart
                    updateStarHistoryChart(projectLinkElement.href, true);
                }
            });

            projectStats.addEventListener('mouseout', (event) => {
                 const projectLinkElement = card.querySelector('.project-info a');
                 if (projectLinkElement) {
                     // Remove the current project from the Star History chart
                     updateStarHistoryChart(projectLinkElement.href, false);
                 }
            });
        }
    });
}

// Initial call for any cards present on page load (if any)
addProjectCardEventListeners();

    // Simulate processing selected projects
    document.getElementById('process-button').addEventListener('click', () => {
    // Get all checked checkboxes
    const checkboxes = document.querySelectorAll('.project-card input[type="checkbox"]:checked');
    // Map checked checkboxes to their corresponding project URLs (assuming data-url attribute exists)
    // Note: The checkbox is removed, this logic might need adjustment based on how selected projects are tracked now
    const selectedUrls = Array.from(checkboxes).map(cb => cb.dataset.url);

    const finalOutputContainer = document.getElementById('final-output');
    if (selectedUrls.length > 0) {
        // In a real application, you would send selectedUrls to the backend
        // for further processing (e.g., integrating information).
        // For this example, we'll just display the selected URLs.
        finalOutputContainer.innerHTML = '<h3>Selected Projects:</h3>' + selectedUrls.map(url => `<p>${url}</p>`).join('');
    } else {
        finalOutputContainer.innerHTML = 'No projects selected.';
    }
});


function updateStarHistoryChart(projectLink, addRepo) {
    const rightPanelTitle = document.querySelector('#right-panel h2');
    if (!rightPanelTitle) return; // Ensure right panel is visible

    let starHistoryContainer = document.getElementById('star-history-container');

    // Extract repo path from project link
    let repoPath = '';
    try {
        const url = new URL(projectLink);
        // Assuming GitHub links are in the format https://github.com/owner/repo
        const pathParts = url.pathname.split('/').filter(part => part !== '');
        if (pathParts.length >= 2) {
            repoPath = `${pathParts[0]}/${pathParts[1]}`;
        }
    } catch (e) {
        console.error('Error parsing project link:', e);
        if (addRepo && starHistoryContainer) {
             starHistoryContainer.innerHTML = '<p>Could not generate Star History chart (invalid link).</p>';
        }
        return;
    }

    if (!repoPath) {
        if (addRepo && starHistoryContainer) {
             starHistoryContainer.innerHTML = '<p>Could not generate Star History chart (invalid link).</p>';
        }
        return;
    }

    let currentRepos = [];
    // Get currently selected repos from checkboxes (this logic needs update as checkboxes are removed)
    // For now, let's assume we only show the hovered project's star history
    // If you need to show hovered + selected, you'll need a different way to track selected projects

    if (addRepo) {
        // If adding, just show the current repo's history
        currentRepos = [repoPath];
    } else {
        // If removing, clear the chart
        currentRepos = [];
    }

    if (starHistoryContainer) {
        if (currentRepos.length > 0) {
            const starHistoryLinkUrl = `https://www.star-history.com/#${currentRepos.join('&')}&Date`;
            const starHistorySvgUrl = `https://api.star-history.com/svg?repos=${currentRepos.join(',')}&type=Date`;

            starHistoryContainer.innerHTML = `
                <a href="${starHistoryLinkUrl}" target="_blank">
                    <img src="${starHistorySvgUrl}" alt="Star History Chart" style="width: 100%; height: auto;">
                </a>
            `;
        } else {
            // If no repos are selected or on mouseout, clear the container
            starHistoryContainer.innerHTML = '';
        }
    } else if (currentRepos.length > 0) {
         // If container does not exist and we need to show a chart, create it
         starHistoryContainer = document.createElement('div');
         starHistoryContainer.id = 'star-history-container';
         const rightPanel = document.getElementById('right-panel');
         const detailsContent = document.getElementById('project-details-content');
         if (rightPanel && detailsContent) {
             detailsContent.parentNode.insertBefore(starHistoryContainer, detailsContent);
         } else if (rightPanelTitle) {
             rightPanelTitle.parentNode.insertBefore(starHistoryContainer, rightPanelTitle.nextSibling);
         }

         const starHistoryLinkUrl = `https://www.star-history.com/#${currentRepos.join('&')}&Date`;
         const starHistorySvgUrl = `https://api.star-history.com/svg?repos=${currentRepos.join(',')}&type=Date`;

         starHistoryContainer.innerHTML = `
             <a href="${starHistoryLinkUrl}" target="_blank">
                 <img src="${starHistorySvgUrl}" alt="Star History Chart" style="width: 100%; height: auto;">
             </a>
         `;
    }
}

// Modify displaySearchResults to include a checkbox in each card
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (results && results.length > 0) {
        results.forEach(result => {
            const card = document.createElement('div');
            card.classList.add('project-card');
            card.innerHTML = `
                <div class="card-header">
                    <h3>${result.title}</h3>
                </div>
                <p>${result.content.substring(0, 200)}...</p>
                <a href="${result.link}" target="_blank">Read More</a>
            `;
            resultsContainer.appendChild(card);
        });
        addProjectCardClickListeners(); // Re-attach listeners after adding new cards
    } else {
        resultsContainer.innerHTML = '<p>No results found.</p>';
    }
}