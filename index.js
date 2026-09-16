const dropImagesContainer = document.getElementById("dropImagesContainer");

const channels = ["R","G","B","A"];
/**
 * @type {Blob[]}
 */
const channelsImages = [null, null, null, null];
// here i well create dropImageFiled for channels
const selectedChannels = [0, 0, 0, 0];

for (let index = 0; index < channels.length; index++) {

    const imageFiledParent = document.createElement("div");
    imageFiledParent.classList.add("column-Flex-Container");
    imageFiledParent.style.gap = "0px";
    imageFiledParent.style.position ="relative";

    const dropImageFiled = document.createElement('div');
    dropImageFiled.classList.add("drop-Image-filed")

    const img = document.createElement('img');
    img.src = "images/upload2.svg"
    img.style.height = "60px";

    const removeImageBtn = document.createElement('img');
    removeImageBtn.src = "images/X.svg";
    removeImageBtn.classList.add('remove-image-filed');
    removeImageBtn.addEventListener('click',(event)=>{
        img.src = "images/upload2.svg"
        img.style.height = "60px";
        removeImageBtn.style.display = "none";
        channelsImages[index] = null;
        processCompositeImage();
        event.stopPropagation();
    });

    const handleFile = (file) => {
        if (file && file.type.startsWith("image/")) {
            img.src = URL.createObjectURL(file);
            img.style.height = "100%";
            uploadImage(index, file);
            removeImageBtn.style.display = "flex";
        }
    };

    const input = document.createElement("input");
    input.style.display = "none";
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change",(event)=>{
        const imageFile = event.target.files[0];
        handleFile(imageFile)    
        input.value = "";
    });

    // Prevent default browser behavior (opening the image file in new tab)
    dropImageFiled.addEventListener("dragover", (event) => {
        event.preventDefault();
        img.src = "images/AddSign.svg";
    });

    dropImageFiled.addEventListener("dragleave", () => {        
        img.src = "images/upload2.svg"
    });

    dropImageFiled.addEventListener("drop", (event) => {
        event.preventDefault();
        img.src = "images/upload2.svg"

        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const droppedFile = event.dataTransfer.files[0];
            handleFile(droppedFile);
        }
    });

    dropImageFiled.appendChild(img);
    dropImageFiled.appendChild(input);
    dropImageFiled.appendChild(removeImageBtn);

    dropImageFiled.addEventListener('click',()=>{ input.click() });

    const imageLabel = document.createElement('label');
    imageLabel.classList.add("image-filed-label");
    imageLabel.textContent = channels[index];
    
    imageFiledParent.appendChild(dropImageFiled);
    imageFiledParent.appendChild(createPickChannelForImageFiled(index));
    imageFiledParent.appendChild(imageLabel);

    dropImagesContainer.appendChild(imageFiledParent);
}

// Here I will create an picker that allowed user to pick a specific channel in the dropped image
// This will be created for every dropped image field
function createPickChannelForImageFiled(slotIndex){
    const div = document.createElement("div");
    div.classList.add("pick-channel-container");
    
    /**
     * @type {HTMLElement[]}
     */
    const pickerChannels = [];
    for (let index = 0; index < channels.length; index++) {
        const channelName = channels[index];

        const channelLabel = document.createElement('label');  
        channelLabel.textContent = channelName;
        channelLabel.classList.add("Channel-Picker-label")

        if(index == 0){
            channelLabel.style.color = "red";
        }

        channelLabel.addEventListener('click',(event)=>{
            selectedChannels[slotIndex] = index;
            processCompositeImage();
            ChannelPickerPressed(event.target);
        });

        pickerChannels.push(channelLabel);
        div.appendChild(channelLabel);

        // Here I just update the visual when the user click a specific channel
        function ChannelPickerPressed(pressedChannel){
            console.log("Clicked");
            for (let index = 0; index < pickerChannels.length; index++) {
                const element = pickerChannels[index];
    
                if(pressedChannel == element){
                    element.style.color = "red";
                }else{
                    element.style.color = "black";
                }
            }
        }
    }
    
    return div;
}

const resultImage = document.getElementById('resultImage');


/**
  * @param {number} targetChannel 
 * @param {Blob} Blob 
 */
const reader = new FileReader();

function uploadImage(targetChannel,Blob) { // I need to handle if the Blob is null
    channelsImages[targetChannel] = Blob;
    processCompositeImage();
}

async function processCompositeImage() {
    const ctx = resultImage.getContext('2d');

    // 1. Load available images into Image objects
    const loadedImages = await Promise.all(
        channelsImages.map(blob => {
            if (!blob) return null;
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = URL.createObjectURL(blob);
            });
        })
    );

    // 2. Find canvas dimensions (use max dimensions among uploaded images)
    let width = 0;
    let height = 0;
    loadedImages.forEach(img => {
        if (img) {
            width = Math.max(width, img.width);
            height = Math.max(height, img.height);
        }
    });

    // If no images are present, reset canvas size and clear it completely
    if (width === 0 || height === 0) {
        resultImage.width = 0;
        resultImage.height = 0;
        ctx.clearRect(0, 0, resultImage.width, resultImage.height);
        return;
    }

    resultImage.width = width;
    resultImage.height = height;

    // 3. Read source pixel data for each slot (null if removed/empty)
    const channelPixelData = loadedImages.map(img => {
        if (!img) return null;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, width, height);
        return tempCtx.getImageData(0, 0, width, height).data;
    });

    // 4. Create target output buffer
    const outputImageData = ctx.createImageData(width, height);
    const outputData = outputImageData.data;

    // 5. Combine selected channels (Defaults: R=0, G=0, B=0, A=255)
    const pixelCount = width * height * 4;
    for (let p = 0; p < pixelCount; p += 4) {
        // Red (Target 0) -> default 0
        const rSrcData = channelPixelData[0];
        outputData[p] = rSrcData ? rSrcData[p + selectedChannels[0]] : 0;

        // Green (Target 1) -> default 0
        const gSrcData = channelPixelData[1];
        outputData[p + 1] = gSrcData ? gSrcData[p + selectedChannels[1]] : 0;

        // Blue (Target 2) -> default 0
        const bSrcData = channelPixelData[2];
        outputData[p + 2] = bSrcData ? bSrcData[p + selectedChannels[2]] : 0;

        // Alpha (Target 3) -> default 255 (1.0 opacity)
        const aSrcData = channelPixelData[3];
        outputData[p + 3] = aSrcData ? aSrcData[p + selectedChannels[3]] : 255;
    }

    // 6. Render updated pixel data
    ctx.putImageData(outputImageData, 0, 0);
}

function Download(){
    let noImageUploaded = true;
    for (let index = 0; index < channelsImages.length; index++) {
        if(channelsImages[index] !== null){
            noImageUploaded = false;
            break;
        }
    }    
    if(noImageUploaded) return;

    const canvas = document.getElementById("resultImage");
    const imageURI = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.download = "composite-image.png";
    link.href = imageURI;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}