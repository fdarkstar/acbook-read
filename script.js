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
const toggleTimelineButton = document.getElementById('toggle-timeline-button'); // 新增
const timelineContainer = document.getElementById('timeline-container'); // 新增
const timelineList = document.getElementById('timeline-list'); // 新增
const errorMessageElement = document.getElementById('error-message');

let visitedScenesTimeline = []; // 新增：存储访问过的场景及其信息

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

    // 将当前场景添加到时间线
    const sceneInfo = {
        id: currentSceneId,
        text: currentScene.text.substring(0, 30) + '...', // 截取部分文本用于显示
        timestamp: currentScene.createdAt || Date.now() // 使用场景创建时间，如果不存在则用当前时间
    };
    visitedScenesTimeline.push(sceneInfo);
    renderTimeline(); // 更新时间线显示

    // Helper function to convert markdown-like bold/italic to HTML
    function convertMarkdownToHtml(text) {
        // Convert **bold** to <strong>bold</strong>
        let convertedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert *italic* to <em>italic</em>
        convertedText = convertedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return convertedText;
    }

    novelTitleElement.textContent = novelData.title;
    sceneTextElement.innerHTML = convertMarkdownToHtml(currentScene.text); // Use innerHTML and convert markdown
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

function renderTimeline() {
    timelineList.innerHTML = ''; // 清空现有列表
    visitedScenesTimeline.forEach((scene, index) => {
        const li = document.createElement('li');
        const date = new Date(scene.timestamp);
        li.textContent = `${date.toLocaleTimeString()} - ${scene.id}: ${scene.text}`;
        if (index === visitedScenesTimeline.length - 1) { // 标记当前场景
            li.classList.add('active-scene');
        }
        timelineList.appendChild(li);
    });
    // 滚动到最新场景
    timelineList.scrollTop = timelineList.scrollHeight;
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
                visitedScenesTimeline = []; // 新增：清空时间线历史
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
        if (visitedScenesTimeline.length > 1) { // 确保至少有两个场景才移除
            visitedScenesTimeline.pop(); // 移除当前场景，因为要回溯到上一个
        }
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
document.addEventListener('DOMContentLoaded', () => {
    renderScene();
    // 初始隐藏时间线
    timelineContainer.classList.add('timeline-hidden');
});

// 切换时间线显示/隐藏
toggleTimelineButton.addEventListener('click', () => {
    timelineContainer.classList.toggle('timeline-hidden');
    if (timelineContainer.classList.contains('timeline-hidden')) {
        toggleTimelineButton.textContent = '显示时间线';
    } else {
        toggleTimelineButton.textContent = '隐藏时间线';
    }
});
