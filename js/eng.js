function getBom(stp,nstp,filter,template,output)
{
    return {
        type: "ExecuteFunction",
        name: stp+"Step",
        next: nstp+"Step",
        addonName: "viewer",
        functionName: "generateBom",
        arguments: [
            {
                filterId: filter,
                templateId: template
            }
        ],
        output: ".bom"+output
    };
}
function return_if(Tstep,Fstep,output)
{
    return{
        type: "If",
        name: "ifStep"+output,
        condition: ".bom"+output+".body | length >0",
        true: Tstep+"Step",
        false: Fstep+"Step"
    }
}
function get_backendExec(stp,nstep,bendId,output)
{
    return{
        type: "ExecuteBackendFlow",
        name: stp+"Step",
        next: nstep+"Step",
        backendFlowId: bendId,
        input: "#{.data}",
        output: ".matrix"+output
    }
}
function exec_Function(keys,stp)
{
    const dynamicString = `#{${keys.map(key => `.matrix${key}.data.result`).join(' + ')}}`;
    return {
        type: "ExecuteFunction",
        name: stp+"Step",
        addonName: "viewer",
        functionName: "setPrice",
        arguments: [dynamicString],
        output: "."
    };
}

function bend_csv(csvid,rangA,rangB,output,map,compA,compB)
{
    const codeStrut = [
        {
            "name": "firstStep",
            "type": "FileSystemDownload",
            "next": "secondStep",
            "operationType": "csv",
            "uuid": csvid,
            "csvFormattingOptions": {
              "fieldSeparator": ";",
              "endOfLine": "\r\n",
              "excelBOM": false
            },
            "outputType": "array",
            "output": ".csvArray"
          },
          {
            "name": "secondStep",
            "type": "InsertUUID",
            "next": "thirdStep",
            "output": ".uuid"
          },
          {
            "name": "thirdStep",
            "type": "MapInputViaMatrix",
            "next": "fourthStep",
            "matrixInput": ".csvArray",
            "dataRange": {
              "start": [
                rangA,
                rangB
              ]
            },
            "compare": {
              "columns": {
                "operator": "<=",
                "type": "single",
                "value": Compare_string(map,output,compA)
              },
              "rows": {
                "operator": "<=",
                "type": "single",
                "value": Compare_string(map,output,compB)
              }
            },
            "fallbackValue": -1,
            "output": ".matrixPricing.values"
          },
          {
            "name": "fourthStep",
            "type": "Transform",
            "input": ".matrixPricing.values",
            "output": ".result",
            "transformation": "reduce (.[] | tonumber) as $item (0; . + $item)"
          }
    ]
    return codeStrut;
}
function Compare_string(map,output,num)
{
    if (map === 0) {
        return `.bom${output}.body[][${num}]`;
    } else {
        return `.bom${output}.body | map(.[${num}])`;
    }
}
let codeStructure = []; 
function genFront()
{
    codeStructure = [];
    let keys = [];
    let step = 1;
    let filterID,templateID,output,backednID,currOBJ;
    let blockC = document.querySelector('.container').querySelectorAll('.block').length;
    for(let i = 0; i <blockC; i++){
        if(document.querySelector('.container .block[data-id="'+(i+1)+'"]').querySelector('select').value === '2'){
            codeStructure.push(exec_Function(keys,step))
        }
        else
        {
            currOBJ = document.querySelector('.container .block[data-id="'+(i+1)+'"]').querySelector('.inputs-container').querySelectorAll('input');
            filterID = +currOBJ[0].value;
            templateID= +currOBJ[1].value;
            output = currOBJ[2].value;
            backednID = currOBJ[3].value;
            codeStructure.push(getBom(step,step+1,filterID,templateID,output))
            codeStructure.push(return_if(step+1,step+2,output))
            codeStructure.push(get_backendExec(step+1,step+2,backednID,output))
            keys.push(output)
            step +=2
        }
    }
   // document.querySelector('.container .block[data-id="'+1+'"]'); //getting single block
   // document.querySelector('.container .block[data-id="'+1+'"]').querySelector('.inputs-container').querySelectorAll('input')[0].value
   codeTextarea.value = JSON.stringify(codeStructure, null, 2)
}
let BendcodeStructure = []; 
function genBendCode()
{
    BendcodeStructure = [];
    let csvid,rangA,rangB,output,map,compA,compB;
    csvid = document.querySelector("#stringInput1").value
    rangA = +document.querySelector("#numberInput1").value
    rangB = +document.querySelector("#numberInput2").value
    output = document.querySelector("#stringInput2").value
    map = +document.querySelector("#numberInput3").value
    compA = +document.querySelector("#numberInput4").value
    compB = +document.querySelector("#numberInput5").value
    BendcodeStructure.push(bend_csv(csvid,rangA,rangB,output,map,compA,compB));
    let cleanedCode = BendcodeStructure[0];
    document.getElementById('BendTA-2').value = JSON.stringify(cleanedCode, null, 2);
}



let blockCounter = 0; // Keeps track of the number of blocks

const container = document.querySelector('.container');
const addBlockButton = document.getElementById('addBlock');

// Function to create a new block
function createBlock() {
  blockCounter++;
  const block = document.createElement('div');
  block.classList.add('block');
  block.setAttribute('draggable', 'true');
  block.setAttribute('data-id', blockCounter);


    block.innerHTML = `
    <div class="header">Block ${blockCounter}</div>
    <select class="list" onchange="updateInputs(event, ${blockCounter})">
      <option value="1">Bom If Bend Exec Block (2 Numbers + 1 Text)</option>
      <option value="2" selected="selected">ExecuteFunction Block</option>

    </select>
    <div class="inputs-container" id="inputs-${blockCounter}">
      <!-- Dynamic inputs will go here -->
    </div>
    <button class="remove-btn" onclick="removeBlock(${blockCounter})">×</button>
  `;
  
  

  addDragEvents(block);
  container.appendChild(block);
  updateBlockNumbers(); // Re-number blocks
}

// Function to remove a block
function removeBlock(blockId) {
  const blockToRemove = document.querySelector(`.block[data-id="${blockId}"]`);
  if (blockToRemove) {
    blockToRemove.remove();
    updateBlockNumbers(); // Re-number blocks after removal
  }
}

// Add drag events to a block
function addDragEvents(block) {
  block.addEventListener('dragstart', () => {
    block.classList.add('dragging');
  });

  block.addEventListener('dragend', () => {
    block.classList.remove('dragging');
    updateBlockNumbers(); // Re-number blocks after dragging
  });
}

// Add dragover event to the container
container.addEventListener('dragover', (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(container, e.clientY);
  const draggedBlock = document.querySelector('.dragging');
  if (afterElement == null) {
    container.appendChild(draggedBlock);
  } else {
    container.insertBefore(draggedBlock, afterElement);
  }
});

// Get the element after the dragged position
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.block:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Function to update the numbering of all blocks
function updateBlockNumbers() {
  const blocks = [...container.querySelectorAll('.block')];
  blocks.forEach((block, index) => {
    const blockHeader = block.querySelector('.header');
    blockHeader.textContent = `Block ${index + 1}`;
    block.setAttribute('data-id', index + 1); // Re-set the data-id based on position
  });
}

// Update the inputs based on the selected option
function updateInputs(event, blockId) {
  const selectedOption = event.target.value;
  const inputsContainer = document.getElementById(`inputs-${blockId}`);
  
  // Clear the existing inputs
  inputsContainer.innerHTML = '';

  // Based on the selected option, generate the respective inputs
  if (selectedOption === '1') {
    // Option 1: 2 numeric inputs and 1 text input
    inputsContainer.innerHTML = `
      <input type="number" placeholder="Filter ID" />
      <input type="number" placeholder="Template ID"  />
      <input type="text" placeholder="OUTPUT" />
      <input type="text" placeholder="Backend ID" />
    `;
  } else if (selectedOption === '2') {
    // Option 2: 2 text inputs

  } else if (selectedOption === '3') {
    // Option 3: No inputs
    // Nothing to add
  }
}

// Add block button event listener
addBlockButton.addEventListener('click', createBlock);

// Initialize with one block
createBlock();


const copyButton = document.getElementById('copyButton');
const codeTextarea = document.getElementById('BendTA-1');

function copyToClipboard(textareaId) {
    // Get the textarea element by its ID
    const textarea = document.getElementById(textareaId);
    
    // Select the text inside the textarea
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices

    // Copy the selected text to clipboard
    document.execCommand('copy');


  }