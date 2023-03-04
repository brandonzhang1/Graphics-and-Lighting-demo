/*
    Initialization
*/

// The WebGL context.
var gl
var canvas;

// Variables for spinning the cube
var angle;
var angularSpeed;

var key = 0;
var boxRotate = 1;
var coneRotate = 1;
var initX = 0;
var initY = 0;
var currX = 0;
var currY = 0;
var cumTransMat = translate(0, 0, 0);
var transDeltaZ = 0;
var transDelta = [0, 0];
var transMat = translate(0, 0, 0);



// Sets up the canvas and WebGL context.
function initializeContext() {
    // Get and store the webgl context from the canvas    
    canvas = document.getElementById("myCanvas");
    gl = canvas.getContext("webgl2");

    // Determine the ratio between physical pixels and CSS pixels
    const pixelRatio = window.devicePixelRatio || 1;

    // Set the width and height of the canvas
    // using clientWidth and clientHeight
    canvas.width = pixelRatio * canvas.clientWidth;
    canvas.height = pixelRatio * canvas.clientHeight;

    // Set the viewport size
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set the clear color to white.
    gl.clearColor(1, 1, 1, 0);
    // Set the line width to 3.0.
    gl.lineWidth(.0);

    // TODO: Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    //logMessage("WebGL initialized.");
}

async function setup() {
    initializeContext();
    setEventListeners(canvas);
    loadBunny();
    loadBox();
    loadCone();
    createBuffers();
    createBoxBuffers();
    createConeBuffers();
    await loadShaders();
    compileShaders();
    await loadBunnyShaders();
    compileBunnyShaders();
    createVertexArrayObjects();
    requestAnimationFrame(render);
};

window.onload = setup;

var bvertices = [];
var bfaces = [];
var bcolors = [];
var bnormals = [];

async function loadBunny() {
    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];
    bvertices = get_vertices();
    
    for (let i = 0; i < bvertices.length+1; i++) {
        //bcolors.push(vertexColors[1]);
        bcolors.push([1.0, 0.7, 0.1, 1.0]);
    }

    bcolors = bcolors.flat();
    bfaces = get_faces();

    bvertices.splice(0, 0, [0, 0, 0]);

    //construct normals for faces, add face component in loop, then normalize each
    
    bnormals = Array.from(Array(bvertices.length), () => {
        return [0, 0, 0];
    })

    bfaces.forEach((element) => {
        faceNormal = normalize(cross(subtract(bvertices[element[1]], bvertices[element[0]]), subtract(bvertices[element[2]], bvertices[element[0]])));
        bnormals[element[0]] = add(faceNormal, bnormals[element[0]]);
        bnormals[element[1]] = add(faceNormal, bnormals[element[1]]);
        bnormals[element[2]] = add(faceNormal, bnormals[element[2]]);
    });
    bnormals.forEach((element, index) => {
        bnormals[index] = normalize(element);
    })
    bnormals = bnormals.flat();
    bnormals.splice(0, 3, 0, 0, 0);

    //flatten remaining arrays
    bvertices = bvertices.flat();
    bfaces = bfaces.flat();

    //logMessage("Bunny data loaded.");
}

var boxVertices = [];
var boxLines = [];
var boxColors = [];
var boxPositions = [];

function loadBox() {
    var size = 0.25;
    boxVertices = [
        [0, 0, 0],
        [size, size, size],
        [size, size, -size],
        [size, -size, size],
        [size, -size, -size],
        [-size, size, size],
        [-size, size, -size],
        [-size, -size, size],
        [-size, -size, -size]
    ];

    boxLines = [
        // between vertices with distance 1
        1, 2,
        1, 3,
        1, 5,
        2, 4,
        2, 6,
        3, 4,
        3, 7,
        4, 8,
        5, 6,
        5, 7,
        6, 8,
        7, 8
    ];

    for (let i = 0; i < boxLines.length; i++) {
        boxPositions.push(boxVertices[boxLines[i]]);
        boxColors.push([0.0, 0.0, 1.0, 1.0]);
    }
    boxPositions = boxPositions.flat();
    boxColors = boxColors.flat();
}

var conePositions = [];
var coneColors = [];

function loadCone() {
    var basePoints = 60;
    var size = 0.7;
    var coneVertices = [
        [0, 0, 0]
    ];

    for (let i = 0; i < 360; i+= 360/basePoints) {
        var t = rotate(i, [0, 1, 0]);
        var v = vec3(size, -2*size, 0)
        coneVertices.push([v[0]*t[0][0] + v[1]*t[0][1] + v[2]*t[0][2], v[0]*t[1][0] + v[1]*t[1][1] + v[2]*t[1][2], v[0]*t[2][0] + v[1]*t[2][1] + v[2]*t[2][2]]);
    }
    
    //lines one from 0 to each base point, then 1 between adjacent base points
    for (let i = 1; i < coneVertices.length; i++) {
        conePositions.push(coneVertices[0]);
        conePositions.push(coneVertices[i]);
    }
    for (let i = 1; i < coneVertices.length-1; i++) {
        conePositions.push(coneVertices[i]);
        conePositions.push(coneVertices[i+1]);
    }
    conePositions.push(coneVertices[coneVertices.length-1]);
    conePositions.push(coneVertices[1]);

    for (let i = 0; i < conePositions.length; i++) {
        coneColors.push([0.0, 0.0, 1.0, 1.0]);
    }
    conePositions = conePositions.flat();
    coneColors = coneColors.flat();
    
    //logMessage(conePositions.length);
    //logMessage(coneColors.length);
}


// Buffer objects
var position_buffer;
var color_buffer;
var indices_buffer;
var normal_buffer;

function createBuffers() {
    position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(bvertices),
        gl.STATIC_DRAW);

    // Repeat for the color vertex data.
    color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(bcolors),
        gl.STATIC_DRAW);

    indices_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(bfaces),
        gl.STATIC_DRAW);
    
    normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(bnormals),
        gl.STATIC_DRAW);

    //logMessage("Created buffers.");
}

var box_position_buffer;
var box_color_buffer;
var box_indices_buffer;

function createBoxBuffers() {
    box_position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, box_position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxPositions), gl.STATIC_DRAW);
    
    box_color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, box_color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxColors), gl.STATIC_DRAW);
}

var cone_position_buffer;
var cone_color_buffer;

function createConeBuffers() {
    cone_position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cone_position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(conePositions), gl.STATIC_DRAW);
    
    cone_color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cone_color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneColors), gl.STATIC_DRAW);    
}

// Shader sources
var vs_source;
var fs_source;

function loadShaderFile(url) {
    return fetch(url).then(response => response.text());
}

// Loads the shader data from the files.
async function loadShaders() {
    // Specify shader URLs for your
    // local web server.
    const shaderURLs = [
        './main.vert',
        './main.frag'
    ];

    // Load shader files.
    const shader_files = await Promise.all(shaderURLs.map(loadShaderFile));

    // Assign shader sources.
    vs_source = shader_files[0];
    fs_source = shader_files[1];

    // logMessage(vs_source);
    // logMessage(fs_source);

    //logMessage("Shader files loaded.")
}

var bunny_vs_source;
var bunny_fs_source;

async function loadBunnyShaders() {
    // Specify shader URLs for your
    // local web server.
    const shaderURLs = [
        './bunny.vert',
        './bunny.frag'
    ];

    // Load shader files.
    const shader_files = await Promise.all(shaderURLs.map(loadShaderFile));

    // Assign shader sources.
    bunny_vs_source = shader_files[0];
    bunny_fs_source = shader_files[1];

    // logMessage(vs_source);
    // logMessage(fs_source);

    //logMessage("Bunny Shader files loaded.")
}

// Shader handles
var vs;
var fs;
var prog;

// Compile the GLSL shader stages and combine them
// into a shader program.
function compileShaders() {
    // Create a shader of type VERTEX_SHADER.
    vs = gl.createShader(gl.VERTEX_SHADER);
    // Specify the shader source code.
    gl.shaderSource(vs, vs_source);
    // Compile the shader.
    gl.compileShader(vs);
    // Check that the shader actually compiled (COMPILE_STATUS).
    // This can be done using the getShaderParameter function.
    // The error message can be retrieved with getShaderInfoLog.
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        logError(gl.getShaderInfoLog(vs));
        gl.deleteShader(vs);
    }

    // Repeat for the fragment shader.
    fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fs_source);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        logError(gl.getShaderInfoLog(fs));
        gl.deleteShader(fs);
    }

    // Next we have to create a shader program
    // using the shader stages that we compiled.

    // Create a shader program.
    prog = gl.createProgram();

    // Attach the vertex and fragment shaders
    // to the program.
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);

    // Link the program
    gl.linkProgram(prog);

    // Check the LINK_STATUS using getProgramParameter
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        logError(gl.getProgramInfoLog(prog));
    }

    //logMessage("Shader program compiled successfully.");
}

var bunnyvs;
var bunnyfs;
var bunnyProg;


function compileBunnyShaders() {
    // Create a shader of type VERTEX_SHADER.
    bunnyvs = gl.createShader(gl.VERTEX_SHADER);
    // Specify the shader source code.
    gl.shaderSource(bunnyvs, bunny_vs_source);
    // Compile the shader.
    gl.compileShader(bunnyvs);
    // Check that the shader actually compiled (COMPILE_STATUS).
    // This can be done using the getShaderParameter function.
    // The error message can be retrieved with getShaderInfoLog.
    if (!gl.getShaderParameter(bunnyvs, gl.COMPILE_STATUS)) {
        logError(gl.getShaderInfoLog(bunnyvs));
        gl.deleteShader(bunnyvs);
    }

    // Repeat for the fragment shader.
    bunnyfs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(bunnyfs, bunny_fs_source);
    gl.compileShader(bunnyfs);

    if (!gl.getShaderParameter(bunnyfs, gl.COMPILE_STATUS)) {
        logError(gl.getShaderInfoLog(bunnyfs));
        gl.deleteShader(bunnyfs);
    }

    // Next we have to create a shader program
    // using the shader stages that we compiled.

    // Create a shader program.
    bunnyProg = gl.createProgram();

    // Attach the vertex and fragment shaders
    // to the program.
    gl.attachShader(bunnyProg, bunnyvs);
    gl.attachShader(bunnyProg, bunnyfs);

    // Link the program
    gl.linkProgram(bunnyProg);

    // Check the LINK_STATUS using getProgramParameter
    if (!gl.getProgramParameter(bunnyProg, gl.LINK_STATUS)) {
        logError(gl.getProgramInfoLog(bunnyProg));
    }

    //logMessage("Shader program compiled successfully.");
}


var bunnyTransform = [];

// Sets the uniform variables in the shader program
function setUniformVariables() {
    var view_loc = gl.getUniformLocation(bunnyProg, "viewtransform");
    var transform_loc = gl.getUniformLocation(bunnyProg, "postransform");
    var coneTransLoc = gl.getUniformLocation(bunnyProg, "conetransform");
    var boxTransLoc = gl.getUniformLocation(bunnyProg, "boxtransform");

    if (key === 1 || key === 3 || key === 4) {
        transMat = translate(transDelta[0]/20, -transDelta[1]/20, transDeltaZ/20);
    } else if (key === 2) {
        if (transDelta[0] === 0 && transDelta[1] === 0) {
            transMat = rotate(0, [0.0, 1.0, 0.0]);
        } else {
            var tempAngle = Math.sqrt(Math.pow(transDelta[0], 2) + Math.pow(transDelta[1], 2))
            transMat = rotate(tempAngle, [transDelta[1], transDelta[0], 0]);
        }
    } else {
        transMat = translate(0, 0, 0);
    }

    model = mult(transMat, cumTransMat);

    var eye = vec3(0, 0, 10);
    var target = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    var view = lookAt(eye, target, up);

    var aspect = canvas.width / canvas.height;
    var projection = perspective(60.0, aspect, 0.1, 1000.0);
    view = mult(projection, view);

    //var bunnyTransform = mult(projection, mult(view, model));

    gl.uniformMatrix4fv(view_loc, false, flatten(view));
    gl.uniformMatrix4fv(transform_loc, false, flatten(model));
    gl.uniformMatrix4fv(coneTransLoc, false, flatten(conePosTransform));
    gl.uniformMatrix4fv(boxTransLoc, false, flatten(boxPosTransform));

    // logMessage("Set uniform variables.")
}

var boxPosTransform = [];
var boxviewTransform = [];

function setBoxUniformVariables(timestamp) {
    updateAngle(timestamp);
    var transform_loc = gl.getUniformLocation(prog, "transform");

    var transMat = translate(5, 5, 0);
    //var transMat = translate(0, 5, 0);
    var rotMat = rotate(boxAngle, [0, 1, 0]);

    var model = mult(rotMat, transMat);
    boxPosTransform = model;

    var eye = vec3(0, 0, 10);
    var target = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    var view = lookAt(eye, target, up);

    var aspect = canvas.width / canvas.height;
    var projection = perspective(60.0, aspect, 0.1, 1000.0);

    var boxTransform = mult(projection, mult(view, model));

    gl.uniformMatrix4fv(transform_loc, false, flatten(boxTransform));

    // logMessage("Set uniform variables.")
}

var conePosTransform = [];

function setConeUniformVariables(timestamp) {
    updateAngle(timestamp);
    var transform_loc = gl.getUniformLocation(prog, "transform");

    var transMat = translate(0, 4, 2);
    var axis = cross([0, 4, 2], [1, 0, 0]);
    var rotMat = rotate(Math.sin(coneAngle/30)*30, axis);

    var model = mult(transMat, rotMat);
    conePosTransform = model;

    var eye = vec3(0, 0, 10);
    var target = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    var view = lookAt(eye, target, up);

    var aspect = canvas.width / canvas.height;
    var projection = perspective(60.0, aspect, 0.1, 1000.0);

    var coneTransform = mult(projection, mult(view, model));

    gl.uniformMatrix4fv(transform_loc, false, flatten(coneTransform));

    // logMessage("Set uniform variables.")
}


// Handle for the vertex array object
var vao;

function createVertexArrayObjects() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
}

function setBunnyVAO() {
    var pos_idx = gl.getAttribLocation(bunnyProg, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.enableVertexAttribArray(pos_idx);
    gl.vertexAttribPointer(pos_idx, 3, gl.FLOAT, false, 0, 0);

    var col_idx = gl.getAttribLocation(bunnyProg, "color");
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.enableVertexAttribArray(col_idx);
    gl.vertexAttribPointer(col_idx, 4, gl.FLOAT, false, 0, 0);
    
    var norm_idx = gl.getAttribLocation(bunnyProg, "normals");
    gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
    gl.enableVertexAttribArray(norm_idx);
    gl.vertexAttribPointer(norm_idx, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
}

function setBoxVAO() {
    var pos_idx = gl.getAttribLocation(prog, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, box_position_buffer);
    gl.enableVertexAttribArray(pos_idx);
    gl.vertexAttribPointer(pos_idx, 3, gl.FLOAT, false, 0, 0);
    
    var col_idx = gl.getAttribLocation(prog, "color");
    gl.bindBuffer(gl.ARRAY_BUFFER, box_color_buffer);
    gl.enableVertexAttribArray(col_idx);
    gl.vertexAttribPointer(col_idx, 4, gl.FLOAT, false, 0, 0);
}

function setConeVAO() {
    var pos_idx = gl.getAttribLocation(prog, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, cone_position_buffer);
    gl.enableVertexAttribArray(pos_idx);
    gl.vertexAttribPointer(pos_idx, 3, gl.FLOAT, false, 0, 0);
    
    var col_idx = gl.getAttribLocation(prog, "color");
    gl.bindBuffer(gl.ARRAY_BUFFER, cone_color_buffer);
    gl.enableVertexAttribArray(col_idx);
    gl.vertexAttribPointer(col_idx, 4, gl.FLOAT, false, 0, 0);
}

var previousTimestamp;
var boxAngle = 0;
var coneAngle = 0;
function updateAngle(timestamp) {
    // TODO: Initialize previousTimestamp the first time this is called.
    if (previousTimestamp === undefined) {
        // console.log("previous" + previousTimestamp);
        previousTimestamp = timestamp;
    }
    if (boxRotate === 1) {
        boxAngle += ((timestamp - previousTimestamp) / 30);
    }
    if (coneRotate === 1) {
        coneAngle += ((timestamp - previousTimestamp) / 30);
    }
    //logMessage(boxAngle);

    // TODO: Update previousTimestamp
    previousTimestamp = timestamp;
}

function updateMouseDelta() {
    transDelta = [currX - initX, currY - initY];
    if (key === 3) {
        transDeltaZ -= 5;
    } else if (key === 4) {
        transDeltaZ += 5;
    }
}

// Draws the vertex data.
function render(timestamp) {
    // TODO: Clear the color and depth buffers
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // draw box
    gl.useProgram(prog);
    setBoxUniformVariables(timestamp);
    setBoxVAO();
    gl.drawArrays(gl.LINES, 0, boxLines.length);

    // draw cone
    gl.useProgram(prog);
    setConeUniformVariables(timestamp);
    setConeVAO();
    gl.drawArrays(gl.LINES, 0, conePositions.length);

     // draw bunny
    gl.useProgram(bunnyProg);
    updateMouseDelta();
    setUniformVariables();
    setBunnyVAO();
    gl.drawElements(gl.TRIANGLES, bfaces.length, gl.UNSIGNED_SHORT, 0);      
  

    // Call this function repeatedly with requestAnimationFrame.
    requestAnimationFrame(render);
}


function saveResetDeltas() {
    cumTransMat = mult(transMat, cumTransMat);
    transMat = translate(0, 0, 0);
    transDelta = [0, 0];
    transDeltaZ = 0;
    currX = 0;
    currY = 0;
    initX = 0;
    initY = 0;
}

function setEventListeners(canvas) {
    canvas.addEventListener('keydown', function (event) {
        switch (event.key) {
            case "p":
                boxRotate = (boxRotate + 1) % 2;
                break;
            case "s":
                coneRotate = (coneRotate + 1) % 2;
                break;
            case "r":
                key = 0;
                cumTransMat = translate(0, 0, 0);
                transDelta = [0, 0];
                transDeltaZ = 0;
                transMat = translate(0, 0, 0);
                currX = 0;
                currY = 0;
                initX = 0;
                initY = 0;
                //document.getElementById("tDelta").innerText = "0 0";
                break;
            case "ArrowUp":
                saveResetDeltas();
                key = 3;
                break;
            case "ArrowDown":
                saveResetDeltas();
                key = 4;
                break;
        }
    });

    canvas.addEventListener('keyup', function (event) {
        switch (event.key) {
            case "ArrowUp":
                if (key === 3) {
                    key = 0;
                    saveResetDeltas();
                }
                break;
            case "ArrowDown":
                if (key === 4) {
                    key = 0;
                    saveResetDeltas();
                }
                break;
        }
    });

    canvas.addEventListener('wheel', function (event) {
        cumTransMat = mult( translate(0, 0, event.deltaY/100),cumTransMat)
    });

    canvas.addEventListener('mousemove', function (event) {
        if (key === 1 || key === 2) {
            currX = event.x;
            currY = event.y;
        }
        //document.getElementById("tDelta").innerText = transDelta[0].toString() + " " + transDelta[1].toString();
    });

    canvas.addEventListener('mousedown', function (event) {
        switch (event.button) {
            case 0:
                saveResetDeltas();
                key = 1;
                break;
            case 2:
                saveResetDeltas();
                key = 2;
                break;
        }
        initX = event.x;
        initY = event.y;
        currX = event.x;
        currY = event.y;
    })

    canvas.addEventListener('mouseup', function (event) {
        switch (event.button) {
            case 0:
                if (key === 1) {
                    key = 0;
                    saveResetDeltas();
                }
                break;
            case 2:
                if (key === 2) {
                    key = 0;
                    saveResetDeltas();
                }
                break;
        }
        
    })

}



// Logging

function logMessage(message) {
    document.getElementById("messageBox").innerText += `[msg]: ${message}\n`;
}

function logError(message) {
    document.getElementById("messageBox").innerText += `[err]: ${message}\n`;
}

function logObject(obj) {
    let message = JSON.stringify(obj, null, 2);
    document.getElementById("messageBox").innerText += `[obj]:\n${message}\n\n`;
}