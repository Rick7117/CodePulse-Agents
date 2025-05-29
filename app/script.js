document.getElementById('search-button').addEventListener('click', async () => {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    // 将搜索图标更改为省略号图标
    const searchButton = document.getElementById('search-button');
    searchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>';

    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = ''; // 清空左侧卡片
    document.getElementById('process-button').style.display = 'none';
    document.getElementById('final-output').innerHTML = '';
    
    // 重置右侧面板标题和内容
    const detailsTitle = document.getElementById('project-details-title');
    if (detailsTitle) {
        detailsTitle.textContent = 'Details';
    }
    const detailsContent = document.getElementById('project-details-content');
    if (detailsContent) {
        detailsContent.innerHTML = 'Please select a project to view details.';
    }

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
        
        // 搜索完成后，将图标变回搜索图标
        searchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path></svg>';
        if (results.length > 0) {
            results.forEach(project => {
                const card = document.createElement('div');
                card.classList.add('project-card');
        card.innerHTML = `
            <input type="checkbox" class="project-checkbox">
            <div class="project-details-wrapper"> <!-- New wrapper div -->
                <div class="project-info-about-wrapper"> <!-- New wrapper for info and about -->
                    <div class="project-info">
                        <h3><a href="${project.url}" target="_blank">${project.repo_name || 'No title available'}</a></h3>
                    </div>
                    <div class="project-about">${project.description || 'No descirption'}</div>
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
        
        // 发生错误时也将图标变回搜索图标
        searchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path></svg>';
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
        // Add click listener to the card for showing details
        card.addEventListener('click', async (event) => {
            // Prevent clicking the stats from triggering the card click
            if (event.target.closest('.project-stats')) {
                return;
            }
            
            // 如果点击的是复选框，不执行卡片的选择逻辑
            if (event.target.classList.contains('project-checkbox')) {
                return;
            }

            // Find the checkbox within the clicked card and toggle its checked state
            const checkbox = card.querySelector('.project-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
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
            
            // 更新右侧面板标题显示项目名称
            const detailsTitle = document.getElementById('project-details-title');
            if (detailsTitle) {
                detailsTitle.textContent = projectTitle;
            }

            // Get the current search query from the input field
            const currentQuery = document.getElementById('search-input').value; // Added to get query

            const detailsContent = document.getElementById('project-details-content');
            if (detailsContent) {
                // 先清空右侧屏幕中之前的内容
                detailsContent.innerHTML = '';
                
                // 显示加载指示器
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'loading-indicator';
                loadingDiv.innerHTML = `
                    <div class="spinner"></div>
                    <p>Summarizing...</p>
                `;
                detailsContent.appendChild(loadingDiv);

                // Fetch project details from the backend
                try {
                    const response = await fetch('/project_details', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ repo_name: projectTitle, query: currentQuery }) // Include query in the body
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

                    // Generate language bar and legend
                    let languageHtml = '';
                    const languages = projectDetails.languages; // Get language data
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
                        // GitHub-like color palette (avoiding bright red and green)
                        const githubColors = [
                            '#3178c6', // TypeScript blue
                            '#f1e05a', // JavaScript yellow
                            '#e34c26', // HTML orange
                            '#563d7c', // CSS purple
                            '#384d54', // Docker blue-gray
                            '#89e051', // Shell green (muted)
                            '#701516', // Ruby dark red (muted)
                            '#b07219', // Java brown
                            '#2b7489', // Python blue
                            '#00ADD8', // Go cyan
                            '#512BD4', // C# purple
                            '#A97BFF', // Kotlin purple
                            '#DA5B0B', // Rust orange
                            '#4F5D95'  // PHP blue
                        ];
                        sortedLanguages.forEach(([lang, percentage], index) => {
                            const colorIndex = index % githubColors.length;
                            const consistentColor = githubColors[colorIndex];
                            languageHtml += `<div class="language-segment" style="width: ${percentage}%; background-color: ${consistentColor};" title="${lang}: ${percentage.toFixed(2)}%"></div>`;
                        });
                        languageHtml += '</div>'; // .language-bar
                        languageHtml += '<div class="language-legend">';
                        sortedLanguages.forEach(([lang, percentage], index) => {
                             const colorIndex = index % githubColors.length;
                             const consistentColor = githubColors[colorIndex];
                             languageHtml += `<span class="legend-item"><span class="legend-color" style="background-color: ${consistentColor};"></span>${lang} ${percentage.toFixed(2)}%</span>`;
                        });
                        languageHtml += '</div>'; // .language-legend
                        languageHtml += '</div>'; // .language-container
                    }

                    // Generate project basic info section
                    const basicInfoHtml = `
                        <div class="project-basic-info">
                            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                                <span style="display: flex; align-items: center; gap: 6px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path></svg> <strong>Stars</strong> ${projectDetails.stars || 0}
                                </span>
                                <span style="display: flex; align-items: center; gap: 6px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg> <strong>Forks</strong> ${projectDetails.forks || 0}
                                </span>
                                <span style="display: flex; align-items: center; gap: 6px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"></path></svg> <strong>Watchers</strong> ${projectDetails.watchers || 0}
                                </span>
                                <span style="display: flex; align-items: center; gap: 6px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.25-3.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z"></path></svg> <strong>Created</strong> ${new Date(projectDetails.created_at).toLocaleDateString()}
                                </span>
                                <span style="display: flex; align-items: center; gap: 6px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path></svg> <strong>Last Commit</strong> ${new Date(projectDetails.last_commit).toLocaleDateString()}
                                </span>
                            </div>
                            <div class="info-row" style="margin-top: 20px; display: flex; align-items: center; gap: 8px;">
                                <span class="info-label" style="display: flex; align-items: center; gap: 6px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"></path></svg> <strong>Description:</strong>
                                </span>
                                <span class="info-value">${projectDetails.description || 'No description available'}</span>
                            </div>
                        </div>
                    `;

                    // Generate analysis result section
                    let analysisHtml = '';
                    if (projectDetails.analysis_result) {
                        const analysis = projectDetails.analysis_result;
                        analysisHtml = `
                            <div class="analysis-section">
                                <h3><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="vertical-align: middle; margin-right: 8px;"><path d="M5.75 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm5.25.75a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z"></path><path d="M6.25 0h2A.75.75 0 0 1 9 .75V3.5h3.25a2.25 2.25 0 0 1 2.25 2.25V8h.75a.75.75 0 0 1 0 1.5h-.75v2.75a2.25 2.25 0 0 1-2.25 2.25h-8.5a2.25 2.25 0 0 1-2.25-2.25V9.5H.75a.75.75 0 0 1 0-1.5h.75V5.75A2.25 2.25 0 0 1 3.75 3.5H7.5v-2H6.25a.75.75 0 0 1 0-1.5ZM3 5.75v6.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75Z"></path></svg>项目分析</h3>
                                <div class="analysis-grid" style="display: flex; flex-wrap: wrap; gap: 20px;">
                                    <div class="analysis-item">
                                        <span class="analysis-label"><strong>活跃度评分:</strong></span>
                                        <span class="analysis-score">${analysis.activity_score}/10</span>
                                    </div>
                                    <div class="analysis-item">
                                        <span class="analysis-label"><strong>代码质量评分:</strong></span>
                                        <span class="analysis-score">${analysis.code_quality_score}/10</span>
                                    </div>
                                    <div class="analysis-item">
                                        <span class="analysis-label"><strong>复杂度等级:</strong></span>
                                        <span class="analysis-value">${analysis.complexity_level}</span>
                                    </div>
                                    <div class="analysis-item">
                                        <span class="analysis-label"><strong>维护状态:</strong></span>
                                        <span class="analysis-value">${analysis.maintenance_status}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    // Generate category result section
                    let categoryHtml = '';
                    if (projectDetails.category_result) {
                        const category = projectDetails.category_result;
                        categoryHtml = `
                            <div class="category-section">
                                <h3><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="vertical-align: middle; margin-right: 8px;"><path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"></path></svg>项目分类</h3>
                                <div class="category-content" style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start;">
                                    <div class="category-item">
                                        <span class="category-label"><strong>主要分类:</strong></span>
                                        <span class="primary-category">${category.primary_category}</span>
                                    </div>
                                    ${category.secondary_categories && category.secondary_categories.length > 0 ? `
                                        <div class="category-item">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span class="category-label"><strong>次要分类:</strong></span>
                                                <div class="secondary-categories" style="display: flex; flex-wrap: nowrap; gap: 8px; overflow-x: auto;">
                                                    ${category.secondary_categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                                                </div>
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${category.tags && category.tags.length > 0 ? `
                                        <div class="category-item">
                                            <span class="category-label">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"><path d="M7.22 6.5a.72.72 0 1 1-1.44 0 .72.72 0 0 1 1.44 0Z"></path><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16ZM4 5v3.38c.001.397.159.778.44 1.059l3.211 3.213a1.202 1.202 0 0 0 1.698 0l3.303-3.303a1.202 1.202 0 0 0 0-1.698L9.439 4.44A1.5 1.5 0 0 0 8.379 4H5a1 1 0 0 0-1 1Z"></path></svg>
                                                <strong>标签:</strong>
                                            </span>
                                            <div class="tags" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                                                ${category.tags.map(tag => `<span class="tag" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f8f9fa; font-size: 12px;">${tag}</span>`).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }

                    // Generate report result section
                    let reportHtml = '';
                    if (projectDetails.report_result) {
                        const report = projectDetails.report_result;
                        reportHtml = `
                            <div class="report-section">
                                <h3><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="vertical-align: middle; margin-right: 8px;"><path d="M4.75 7a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5ZM5 4.75A.75.75 0 0 1 5.75 4h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 5 4.75ZM6.75 10a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"></path><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Z"></path></svg>AI 分析报告</h3>
                                <div class="report-content">
                                    <div class="rating">
                                        <span class="rating-label"><strong>推荐评级:</strong></span>
                                        <span class="rating-stars">${(() => {
                                            const starCount = (report.rating.match(/⭐️/g) || []).length;
                                            const filledStar = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="margin-right: 2px;"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>';
                                            const emptyStar = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="margin-right: 2px;"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path></svg>';
                                            return filledStar.repeat(starCount) + emptyStar.repeat(5 - starCount);
                                        })()}</span>
                                    </div>
                                    <div class="summary">
                                        <h4>项目总结</h4>
                                        <p>${report.summary}</p>
                                    </div>
                                    <div class="recommendation">
                                        <h4>推荐理由</h4>
                                        <p>${report.recommendation_reason}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    detailsContent.innerHTML = `
                        ${basicInfoHtml}
                        ${languageHtml ? '<hr class="section-divider">' + languageHtml : ''}
                        ${analysisHtml ? '<hr class="section-divider">' + analysisHtml : ''}
                        ${categoryHtml ? '<hr class="section-divider">' + categoryHtml : ''}
                        ${reportHtml ? '<hr class="section-divider">' + reportHtml : ''}
                    `;
                } catch (error) {
                    detailsContent.innerHTML = `Error loading project details: ${error.message || 'An unknown error occurred.'}`;
                    console.error('Project details fetch error:', error);
                }
            }
        });

        // 为复选框添加单独的点击事件监听器
        const checkbox = card.querySelector('.project-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', (event) => {
                // 阻止事件冒泡，防止触发卡片的点击事件
                event.stopPropagation();
                // 复选框状态在点击时已自动切换，无需手动切换
            });
        }

        // Add mouseover and mouseout listeners to the project stats for Star History
        const projectStats = card.querySelector('.project-stats');
        if (projectStats) {
            projectStats.addEventListener('mouseover', (event) => {
                const projectLinkElement = card.querySelector('.project-info a');
                if (projectLinkElement) {
                    // Add the current project to the Star History chart, passing the event object
                    updateStarHistoryChart(projectLinkElement.href, true, event);
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


function updateStarHistoryChart(projectLink, addRepo, event) { // Accept event object
    console.log('updateStarHistoryChart called with:', { projectLink, addRepo, event }); // Add logging

    let starHistoryContainer = document.getElementById('star-history-container');

    // Create the container if it doesn't exist
    if (!starHistoryContainer) {
        starHistoryContainer = document.createElement('div');
        starHistoryContainer.id = 'star-history-container';
        document.body.appendChild(starHistoryContainer);
        // Add basic styles for floating container
        starHistoryContainer.style.cssText = 'position: absolute; background-color: white; border: 1px solid #ccc; padding: 10px; z-index: 1000; box-shadow: 2px 2px 5px rgba(0,0,0,0.3); display: none; max-width: 400px; height: auto;'; // Adjusted styles for floating box
         // Remove click listener to close the container (mouseout will handle hiding)
        // starHistoryContainer.addEventListener('click', (event) => {
        //      // Close only if clicking the background, not the image/link
        //     if (event.target === starHistoryContainer) {
        //         starHistoryContainer.style.display = 'none';
        //         starHistoryContainer.innerHTML = ''; // Clear content on close
        //     }
        // });
    }

    // Logic for showing/hiding the floating container
    if (addRepo && event) { // Only show if adding and event object is available
        // Position the container near the mouse cursor
        const offsetX = 20; // Offset to the right of the cursor
        const offsetY = 10; // Offset below the cursor
        starHistoryContainer.style.left = `${event.clientX + offsetX}px`;
        starHistoryContainer.style.top = `${event.clientY + offsetY}px`;

        // If adding, show the chart in the floating container
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
            starHistoryContainer.innerHTML = '<p style="color: white;">Could not generate Star History chart (invalid link).</p>'; // Added style for visibility
            starHistoryContainer.style.display = 'flex'; // Show the container
            return;
        }

        console.log('Extracted repoPath:', repoPath); // Add logging

        if (!repoPath) {
            starHistoryContainer.innerHTML = '<p style="color: white;">Could not generate Star History chart (invalid link).</p>'; // Added style for visibility
            starHistoryContainer.style.display = 'flex'; // Show the container
            return;
        }

        const starHistoryLinkUrl = `https://www.star-history.com/#${repoPath}&Date`;
        const starHistorySvgUrl = `https://api.star-history.com/svg?repos=${repoPath}&type=Date`;

        starHistoryContainer.innerHTML = `
            <a href="${starHistoryLinkUrl}" target="_blank">
                <img src="${starHistorySvgUrl}" alt="Star History Chart" style="max-width: 100%; height: auto;">
            </a>
        `; // Adjusted image style
        starHistoryContainer.style.display = 'block'; // Show the container

    } else {
        // If removing (mouse out), hide the container and clear content
        starHistoryContainer.style.display = 'none';
        starHistoryContainer.innerHTML = '';
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

// 添加分隔条拖动调整功能
// console.log('Before DOMContentLoaded listener');
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');

    // Configure marked.js to use highlight.js for code highlighting
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    });

    const resizer = document.getElementById('resizer');
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    let isResizing = false;
    let initialX;
    let initialLeftWidth;

    // 鼠标按下事件
    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        initialX = e.clientX;
        initialLeftWidth = leftPanel.getBoundingClientRect().width;
        
        // 添加resizing类，改变分隔条样式
        resizer.classList.add('resizing');
        
        // 防止选中文本
        document.body.style.userSelect = 'none';
    });

    // 鼠标移动事件
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const deltaX = e.clientX - initialX;
        const newLeftWidth = initialLeftWidth + deltaX;
        const containerWidth = document.querySelector('.main-layout').getBoundingClientRect().width;
        
        // 确保左右面板不会小于最小宽度
        const minWidth = 300; // 与CSS中设置的最小宽度一致
        if (newLeftWidth >= minWidth && (containerWidth - newLeftWidth - resizer.offsetWidth) >= minWidth) {
            // 设置左面板宽度
            leftPanel.style.flex = '0 0 ' + newLeftWidth + 'px';
            // 右面板自动调整
            rightPanel.style.flex = '1';
        }
    });

    // 鼠标释放事件
    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.userSelect = '';
        }
    });

    // 鼠标离开窗口事件
    document.addEventListener('mouseleave', function() {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.userSelect = '';
        }
    });
});