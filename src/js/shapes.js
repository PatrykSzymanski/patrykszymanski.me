document.addEventListener('DOMContentLoaded', () => {
    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Body, Query, Events, World } = Matter;
    const container = document.getElementById('shapes-container');
    if (!container) return;

    // Consolidated configuration
    const CONFIG = {
        WALL_THICKNESS: 50,
        MIN_HEIGHT: 300,
        SHAPE_SIZE: 180,
        TRIANGLE_RADIUS: 120,
        RESET_MARGIN: 50,
        RESET_THROTTLE: 100,
        HIGHLIGHT_DURATION: 300, // Duration for collision highlights in ms
        FORCE_THRESHOLD: 0.5, // Threshold for triggering force field (higher = stronger force needed)
        FORCE_FIELD_ENABLED: false, // Disabled by default
        PHYSICS: {
            positionIterations: 6,
            velocityIterations: 4,
            gravity: { x: 0, y: 0.4 },
            timing: { timeScale: 1 }
        },
        get width() { return container.clientWidth; },
        get height() { return Math.max(container.clientHeight, this.MIN_HEIGHT); }
    };

    // State variables
    let currentShapeColor = '';
    let dynamicBodies = [];
    let boundaries = [];
    let shapesInitialized = false;
    let resizeRequested = false;
    let lastResetTime = 0;
    let mouseConstraint = null;
    const shapeHighlights = new Map(); // Track collision highlights

    // Engine setup with improved configuration
    const engine = Engine.create({
        positionIterations: CONFIG.PHYSICS.positionIterations,
        velocityIterations: CONFIG.PHYSICS.velocityIterations
    });
    
    // Set gravity directly using the CONFIG value
    engine.world.gravity = CONFIG.PHYSICS.gravity;

    // Renderer with optimized settings
    const render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: CONFIG.width,
            height: CONFIG.height,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio || 1,
            hasBounds: true
        }
    });
    render.canvas.style.imageRendering = 'pixelated';

    // Color management
    function getShapeColor() {
        const newColor = getComputedStyle(document.documentElement).getPropertyValue('--color-shape').trim() || '#000000';
        if (newColor !== currentShapeColor) currentShapeColor = newColor;
        return currentShapeColor;
    }

    // Shape creation with optimized properties
    function createShape(type, x, y, color) {
        const baseProps = { 
            restitution: 0.3, 
            friction: 0.1, 
            frictionAir: 0.01,
            render: { fillStyle: color },
            chamfer: type !== 'circle' ? { radius: 16, quality: 10 } : undefined
        };
        
        switch (type) {
            case 'circle':
                return Bodies.circle(x, y, CONFIG.SHAPE_SIZE / 2, baseProps);
            case 'rectangle':
                return Bodies.rectangle(x, y, CONFIG.SHAPE_SIZE, CONFIG.SHAPE_SIZE, baseProps);
            case 'triangle':
                return Bodies.polygon(x, y, 3, CONFIG.TRIANGLE_RADIUS, baseProps);
            default:
                return Bodies.rectangle(x, y, CONFIG.SHAPE_SIZE, CONFIG.SHAPE_SIZE, baseProps);
        }
    }

    // Boundary creation
    function createBoundaries() {
        const { width, height, WALL_THICKNESS } = CONFIG;
        const opts = { 
            isStatic: true, 
            render: { 
                visible: true,
                fillStyle: 'rgba(255, 255, 255, 0.05)', // Very subtle visibility
                lineWidth: 0
            }
        };
        
        return [
            Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2, width, WALL_THICKNESS, opts), // bottom
            Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width, WALL_THICKNESS, opts),         // top
            Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, opts),       // left
            Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, opts) // right
        ];
    }

    // Initialize shapes with better positioning logic
    function initializeShapes() {
        if (shapesInitialized) return;
        
        const color = getShapeColor();
        const types = ['rectangle', 'circle', 'triangle'];
        const shapes = [];
        
        // Create shapes with more randomized distribution
        types.forEach((type) => {
            // Use a more random distribution across the whole container
            const margin = CONFIG.SHAPE_SIZE;
            const x = margin + Math.random() * (CONFIG.width - margin * 2);
            const y = margin + Math.random() * (CONFIG.height / 2);
            
            shapes.push(createShape(type, x, y, color));
        });
        
        // Add shapes and update the dynamic bodies cache
        World.add(engine.world, shapes);
        updateDynamicBodiesCache();
        shapesInitialized = true;
    }

    // Helper to update dynamic bodies cache
    function updateDynamicBodiesCache() {
        dynamicBodies = Composite.allBodies(engine.world).filter(body => !body.isStatic);
    }

    // Reset shape position when out of bounds
    function resetShapeIfOutOfBounds(body) {
        const { x, y } = body.position;
        const { width, height, RESET_MARGIN } = CONFIG;
        
        if (x < -RESET_MARGIN || x > width + RESET_MARGIN || 
            y < -RESET_MARGIN || y > height + RESET_MARGIN) {
            
            Body.setPosition(body, {
                x: width / 2 + (Math.random() - 0.5) * 100,
                y: height / 2 + (Math.random() - 0.5) * 100
            });
            Body.setVelocity(body, { x: 0, y: 0 });
            Body.setAngularVelocity(body, 0);
        }
    }

    // Throttled shape reset check
    function throttledCheckAndResetShapes() {
        const now = Date.now();
        if (now - lastResetTime > CONFIG.RESET_THROTTLE) {
            dynamicBodies.forEach(resetShapeIfOutOfBounds);
            lastResetTime = now;
        }
    }

    // Mouse control setup with improved event handling
    function setupMouseControl() {
        const mouse = Mouse.create(render.canvas);
        
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: { 
                stiffness: 0.2,
                render: { visible: false }
            },
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0
            }
        });
        
        // Use Matter.js's event system for efficient cursor handling
        Events.on(mouseConstraint, 'mousemove', function(event) {
            const query = Query.point(dynamicBodies, event.mouse.position);
            render.canvas.style.cursor = query.length > 0 ? 'pointer' : 'default';
        });
        
        // Register wheel event handler
        render.canvas.addEventListener('wheel', (event) => {
            mouseConstraint.constraint.stiffness = 0;
            setTimeout(() => mouseConstraint.constraint.stiffness = 0.2, 50);
        }, { passive: true });
        
        // Add mouse constraint to world
        World.add(engine.world, mouseConstraint);
        render.mouse = mouse;
    }

    // Resize handling with improved canvas scaling
    function handleResize() {
        if (resizeRequested) return;
        resizeRequested = true;
        
        requestAnimationFrame(() => {
            resizeRequested = false;
            const { width, height } = CONFIG;
            
            // Update render bounds and dimensions
            render.bounds.max.x = width;
            render.bounds.max.y = height;
            render.options.width = width;
            render.options.height = height;
            render.canvas.width = width;
            render.canvas.height = height;
            
            // Update boundaries
            World.remove(engine.world, boundaries);
            boundaries = createBoundaries();
            World.add(engine.world, boundaries);
        });
    }

    // Update shape colors
    function updateShapeColors() {
        const color = getShapeColor();
        dynamicBodies.forEach(body => {
            // Check if shape is currently highlighted
            const highlightData = shapeHighlights.get(body.id);
            
            // Only update color if not currently highlighted
            if (!highlightData || !highlightData.timer) {
                body.render.fillStyle = color;
                
                // Update the stored original color for future highlights
                if (highlightData) {
                    highlightData.originalColor = color;
                }
            }
        });
    }

    // Add collision detection for wall hits with force field effect
    Events.on(engine, 'collisionStart', function(event) {
        // Skip if force field is disabled
        if (!CONFIG.FORCE_FIELD_ENABLED) return;
        
        const pairs = event.pairs;
        
        pairs.forEach(function(pair) {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            
            // Check if one body is a dynamic shape and the other is a boundary
            if ((dynamicBodies.includes(bodyA) && boundaries.includes(bodyB)) || 
                (dynamicBodies.includes(bodyB) && boundaries.includes(bodyA))) {
                
                // Calculate collision force based on velocity
                const dynamicBody = dynamicBodies.includes(bodyA) ? bodyA : bodyB;
                const velocityMagnitude = Math.sqrt(
                    dynamicBody.velocity.x * dynamicBody.velocity.x + 
                    dynamicBody.velocity.y * dynamicBody.velocity.y
                );
                
                // Only show force field for stronger impacts
                if (velocityMagnitude > CONFIG.FORCE_THRESHOLD) {
                    // Get collision point
                    const collisionPoint = pair.collision.supports[0] || pair.collision.position;
                    
                    // Create force field effect with size based on impact strength
                    const forceMultiplier = Math.min(velocityMagnitude / 5, 2); // Cap the maximum multiplier
                    createForceFieldEffect(collisionPoint.x, collisionPoint.y, forceMultiplier);
                }
            }
        });
    });

    // Function to create force field effect
    function createForceFieldEffect(x, y, forceMultiplier = 1) {
        // Create a smaller force field circle effect
        const forcefield = Bodies.circle(x, y, 10, { 
            isStatic: true,
            collisionFilter: { group: -1, category: 0, mask: 0 }, // No collision
            render: { 
                fillStyle: 'rgba(255, 30, 30, 0.7)', // Red glow color
                lineWidth: 0,
                opacity: 0.9
            },
            isSensor: true,
            label: 'forcefield'
        });
        
        // Add to world
        World.add(engine.world, forcefield);
        
        // Animation variables
        let opacity = 0.9;
        let scale = 1;
        let timer = null;
        
        // Animate the effect
        timer = setInterval(() => {
            // Update scale and opacity
            scale += 0.15;
            opacity -= 0.1;
            
            if (opacity <= 0) {
                // Remove the force field when animation completes
                clearInterval(timer);
                World.remove(engine.world, forcefield);
                return;
            }
            
            // Update the force field appearance
            forcefield.render.opacity = opacity;
            
            // Resize the force field based on impact strength
            Body.scale(forcefield, 1 + (0.15 * forceMultiplier), 1 + (0.15 * forceMultiplier));
        }, 16); // Approximately 60 FPS
    }

    // Initialize boundaries
    boundaries = createBoundaries();
    World.add(engine.world, boundaries);

    // Initialize shapes when visible
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) {
                initializeShapes();
                setupMouseControl();
                obs.disconnect();
            }
        }, { threshold: 0.1 });
        observer.observe(container);
    } else {
        initializeShapes();
        setupMouseControl();
    }

    // Start simulation with optimized runner
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Register event listeners
    window.addEventListener('resize', handleResize);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateShapeColors);
    Events.on(engine, 'beforeUpdate', throttledCheckAndResetShapes);

    // Add public method to toggle force field
    container.setForceField = function(enabled) {
        CONFIG.FORCE_FIELD_ENABLED = !!enabled;
    };

    // Cleanup function with comprehensive teardown
    container.cleanup = function() {
        // Remove event listeners
        window.removeEventListener('resize', handleResize);
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateShapeColors);
        Events.off(engine, 'beforeUpdate', throttledCheckAndResetShapes);
        Events.off(engine, 'collisionStart'); // Remove collision event listener
        
        // Stop physics and rendering
        Runner.stop(runner);
        Render.stop(render);
        
        // Clean up Matter.js objects
        if (mouseConstraint) {
            World.remove(engine.world, mouseConstraint);
        }
        
        World.clear(engine.world);
        Engine.clear(engine);
        
        // Clean up DOM elements
        if (render.canvas) {
            render.canvas.remove();
            render.canvas = null;
            render.context = null;
            render.textures = {};
        }
    };
});