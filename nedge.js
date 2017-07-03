/**
 * Nedge
 */

// Constants
INVERSE_NODE_DENSITY = 10000;
NODE_COLOR = "rgb(86, 226, 125)";
EDGE_COLOR = NODE_COLOR;
NODE_MAX_DISTANCE = 0.8;
NODE_RADIUS = 2;
EDGE_WIDTH = 1;

 // Global variables
var canvas;
var context;
var width;
var height;
var requestAnimationFrame;
var nodes = [];
var amountOfNodes;
var edges = [];
var distanceThreshold;

/**
 * Fires when window has loaded
 */
window.onload = function() {
    init();
    createNodes();
    update();
}

/**
 * Re-initialise when the window is resized
 */
window.onresize = function() {
    edges = [];
    nodes = [];
    init();
    createNodes();
}

/**
 * Node object
 * x and y coordinates represent a percentage of the total width and height of
 * the canvas
 */
function Node() {
    this.x = 0;
    this.y = 0;
    this.speedx = 0;
    this.speedy = 0;
    this.age = 0;
    this.color = NODE_COLOR;
    this.radius = NODE_RADIUS;

    /**
     * Sets position, speed and age to new values, such that the Node appears to
     * be new
     */
    this.spawn = function() {
        this.x = Math.random();
        this.y = Math.random();
        this.speedx = ((Math.random() * 0.4) - 0.2) / width;
        this.speedy = ((Math.random() * 0.4) - 0.2) / height;
        this.age = 0;
    }

    /**
     * Calculates the distance between this node and a specified node
     */
    this.distanceTo = function(node, inPixels) {
        if (inPixels) {
            thisx = this.x * width;
            thisy = this.y * height;
            nodex = node.x * width;
            nodey = node.y * height;
            return Math.sqrt((thisx - nodex) ** 2 + (thisy - nodey) ** 2);
        } else {
            return Math.sqrt((this.x - node.x) ** 2 + (this.y - node.y) ** 2);
        }
    }

    /**
     * Draws the node
     */
    this.draw = function(context) {
        // Calculate actual x and y
        _x = Math.round(width * this.x);
        _y = Math.round(height * this.y);

        // Begin drawing circle
        context.beginPath();
        context.arc(_x, _y, this.radius, 0, Math.PI * 2, false);
        context.closePath();
        context.fillStyle = this.color;
        context.fill();
    };

    /**
     * Updates the x and y coordinates of the node
     */
    this.update = function() {
        // Update age
        if (this.age <= 1) {
            this.age += 0.01;
        }

        // Update x and y coordinates
        this.x += this.speedx;
        this.y += this.speedy;

        // Don't let the point wander off the screen
        if (this.x <= 0 || this.x >= 1) {
            this.spawn();
        };
        if (this.y <= 0 || this.y >= 1) {
            this.spawn();
        }
    }
}

/**
 * Edge object
 * A line connecting two nodes, if they are a certain distance from each other
 */
function Edge(startNode, endNode) {
    this.startNode = startNode;
    this.endNode = endNode;
    this.color = EDGE_COLOR;
    this.width = EDGE_WIDTH;
    this.alpha = 0;

    /**
     * Calculates the alpha value
     */
    this.calculateAlpha = function() {
        nodeDistance = this.startNode.distanceTo(this.endNode, true);
        nodeAgeMultiplier = this.startNode.age * this.endNode.age;
        this.alpha = ((distanceThreshold - nodeDistance) / distanceThreshold) * nodeAgeMultiplier;
    }

    /**
     * Draws the line
     */
    this.draw = function(context) {
        // Calculate coordinates
        xStart = Math.round(startNode.x * width);
        yStart = Math.round(startNode.y * height);
        xEnd = Math.round(endNode.x * width);
        yEnd = Math.round(endNode.y * height);

        // Calculate new alpha value
        this.calculateAlpha();

        // Draw line
        context.beginPath();
        context.moveTo(xStart, yStart);
        context.lineTo(xEnd, yEnd);
        context.strokeStyle = convertRGBToRGBA(this.color, this.alpha);
        context.lineWidth = this.width;
        context.stroke();
    }
}

/**
 * Initialises the animation
 */
function init() {
    // Get canvas
    canvas = document.getElementById("canvas");

    // Fix percentage width/height to actual integer dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Get context and information
    context = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;

    // Animation handler
    requestAnimationFrame = window.requestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.msRequestAnimationFrame;

    // Calculate distance threshold
    distanceThreshold = Math.min(width, height) * NODE_MAX_DISTANCE;
}

/**
 * Creates all nodes. The amount of nodes depends on the screen dimension. This
 * way, the screen won't be filled with too many nodes
 */
function createNodes() {
    // Calculate the amount of nodes
    amountOfNodes = (width * height) / INVERSE_NODE_DENSITY;

    // Create nodes
    for (i = 0; i < amountOfNodes; i++) {
        node = new Node();
        node.spawn();
        nodes.push(node);
    }
}

/**
 * Updates all values and draws a new image on the canvas
 */
function update() {
    // Clear canvas
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(0, 0, 0, 0)";
    context.fillRect(0, 0, width, height);

    // Update and draw
    for (i = 0; i < nodes.length; i++) {
        nodes[i].update();
        nodes[i].draw(context);
    }

    // Update edges
    updateEdges();

    // Draw edges
    for (i = 0; i < edges.length; i++) {
        edges[i].draw(context);
    }

    requestAnimationFrame(update);
}

/**
 * Update all edges. Remove and add new edges if required
 */
function updateEdges() {
    // Clear edges, cheaper than checking if edges should be removed since the
    // next task is to identify new edges, in which we should check if existing
    // edges already exist.
    edges = [];

    // Loop through all node pairs
    for (i = 0; i < nodes.length; i++) {
        for (j = 0; j < nodes.length; j++) {

            // Only distinct nodes are relevant
            if (nodes[i] == nodes[j]) {
                continue;
            }

            // Check if the distance is small enough to form an edge
            if (nodes[i].distanceTo(nodes[j], true) < distanceThreshold) {
                edge = new Edge(nodes[i], nodes[j]);
                edges.push(edge);
            }
        }
    }
}

/**
 * Converts a given color in rgb format to rgba format with the given alpha
 * value.
 */
function convertRGBToRGBA(rgb, alpha) {
    return rgb.replace(')', ', ' + alpha + ')').replace('rgb', 'rgba');
}

/**
 * Helper function for array to remove an element
 */
Array.prototype.remove = function(x) {
    this.splice(this.indexOf(x), 1);
}
