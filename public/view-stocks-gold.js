function uploadImageForSubItem(subItemId) {
    if (!subItemId) {
        showNotification("Error: Sub-item ID is missing.", "error");
        return;
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "10000";

    // Create modal
    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "30px";
    modal.style.borderRadius = "12px";
    modal.style.textAlign = "center";
    modal.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";

    const title = document.createElement("h2");
    title.innerText = "Choose an option:";
    modal.appendChild(title);

    // 📸 Take a Photo Button
    const cameraButton = document.createElement("button");
    cameraButton.innerText = "📸 Take a Photo";
    styleButton(cameraButton, "#4CAF50");
    cameraButton.onclick = () => {
        document.body.removeChild(overlay);
        openCamera(subItemId);
    };
    modal.appendChild(cameraButton);

    // 📁 Upload from Device Button
    const uploadButton = document.createElement("button");
    uploadButton.innerText = "📁 Upload from Device";
    styleButton(uploadButton, "#2196F3");
    uploadButton.onclick = () => {
        document.body.removeChild(overlay);
        openFileInput(subItemId);
    };
    modal.appendChild(uploadButton);

    // Append modal to overlay
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close modal when clicking outside
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    function styleButton(button, bgColor) {
        button.style.padding = "15px 30px";
        button.style.fontSize = "18px";
        button.style.margin = "10px";
        button.style.width = "250px";
        button.style.border = "none";
        button.style.background = bgColor;
        button.style.color = "#fff";
        button.style.borderRadius = "8px";
        button.style.cursor = "pointer";
        button.style.fontWeight = "bold";
        button.style.transition = "0.3s";
        button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        button.onmouseover = () => (button.style.opacity = "0.8");
        button.onmouseout = () => (button.style.opacity = "1");
    }
        // Store images temporarily for final upload
        pendingImages.push({ file, subItemId, orderId });

        alert(`Image selected for ${subItemId}. It will be uploaded when the order is finalized.`);
    }
