let novelData = null; // Will be loaded dynamically
let currentSceneId = null;
let sceneHistory = []; // Stack to store visited scene IDs for 'back' functionality

const novelFileInput = document.getElementById('novel-file-input');
const loadNovelButton = document.getElementById('load-novel-button');
const novelTitleElement = document.getElementById('novel-title');
const sceneTextElement = document.getElementById('scene-text');
const choicesContainer = document.getElementById('choices-container');
const backButton = document.getElementById('back-button');
const restartButton = document.getElementById('restart-button');
const errorMessageElement = document.getElementById('error-message');

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
}

function hideMessage(element) {
    element.textContent = '';
    element.className = 'message';
    element.style.display = 'none';
}

function renderScene() {
    hideMessage(errorMessageElement); // Clear any previous error messages
    if (!novelData) {
        novelTitleElement.textContent = "请加载小说文件";
        sceneTextElement.textContent = "";
        choicesContainer.innerHTML = '';
        backButton.disabled = true;
        restartButton.disabled = true;
        return;
    }

    const currentScene = novelData.scenes[currentSceneId];

    if (!currentScene) {
        sceneTextElement.textContent = "错误：场景未找到！请检查小说文件。";
        choicesContainer.innerHTML = '';
        backButton.disabled = true;
        restartButton.disabled = true;
        return;
    }

    novelTitleElement.textContent = novelData.title;
    sceneTextElement.textContent = currentScene.text;
    choicesContainer.innerHTML = ''; // Clear previous choices

    if (currentScene.choices && currentScene.choices.length > 0) {
        currentScene.choices.forEach(choice => {
            const button = document.createElement('button');
            button.classList.add('choice-button');
            button.textContent = choice.text;
            button.addEventListener('click', () => {
                sceneHistory.push(currentSceneId); // Save current scene before moving
                currentSceneId = choice.targetSceneId;
                renderScene();
                updateControls();
            });
            choicesContainer.appendChild(button);
        });
    } else {
        // No choices, it's an ending or a dead end
        const endingMessage = document.createElement('p');
        endingMessage.textContent = "故事到此结束。";
        choicesContainer.appendChild(endingMessage);
    }
    updateControls();
}

function updateControls() {
    backButton.disabled = sceneHistory.length === 0;
    restartButton.disabled = !novelData; // Disable restart if no novel is loaded
}

loadNovelButton.addEventListener('click', () => {
    const file = novelFileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                novelData = JSON.parse(e.target.result);
                if (!novelData.title || !novelData.startSceneId || !novelData.scenes) {
                    throw new Error("无效的小说文件格式。缺少 'title', 'startSceneId' 或 'scenes'。");
                }
                sceneHistory = []; // Clear history for new novel
                currentSceneId = novelData.startSceneId;
                renderScene();
            } catch (error) {
                showMessage(errorMessageElement, "加载小说失败：" + error.message, 'error');
                novelData = null; // Reset novel data on error
                renderScene(); // Render empty state
            }
        };
        reader.readAsText(file);
    } else {
        showMessage(errorMessageElement, "请选择一个小说文件。", 'error');
    }
});

backButton.addEventListener('click', () => {
    if (sceneHistory.length > 0) {
        currentSceneId = sceneHistory.pop(); // Go back to the previous scene
        renderScene();
    }
});

restartButton.addEventListener('click', () => {
    if (novelData) { // Only restart if a novel is loaded
        sceneHistory = []; // Clear history
        currentSceneId = novelData.startSceneId; // Reset to start
        renderScene();
    }
});

// Initial render when the page loads
document.addEventListener('DOMContentLoaded', renderScene);
