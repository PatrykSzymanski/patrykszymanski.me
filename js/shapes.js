// js/shapes.js

document.addEventListener('DOMContentLoaded', () => {
    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Body, Query } = Matter;
    
    const container = document.getElementById('shapes-container');
    if (!container) return;

    const config = {
        width: container.clientWidth,
        height: Math.max(container.clientHeight, 300),
        wallThickness: 50,
        gravity: 0.5,
        shapeSize: 180,
        triangleRadius: 120 // Set to exactly 120
    };

    const engine = Engine.create();
    engine.world.gravity.y = config.gravity;

    const render = Render.create({
        element: container,
        engine,
        options: {
            width: config.width,
            height: config.height,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio || 1,
            hasBounds: true
        }
    });

    render.canvas.style.imageRendering = 'pixelated';

    function createBoundaries() {
        const { width, height, wallThickness } = config;
        const walls = [
            Bodies.rectangle(width/2, height + wallThickness/2, width, wallThickness, { isStatic: true, render: { visible: false } }),
            Bodies.rectangle(width/2, -wallThickness/2, width, wallThickness, { isStatic: true, render: { visible: false } }),
            Bodies.rectangle(-wallThickness/2, height/2, wallThickness, height, { isStatic: true, render: { visible: false } }),
            Bodies.rectangle(width + wallThickness/2, height/2, wallThickness, height, { isStatic: true, render: { visible: false } })
        ];
        Composite.add(engine.world, walls);
        return walls;
    }

    function createShape(type, x, y, color) {
        const commonProps = {
            restitution: 0.3,
            friction: 0.1,
            frictionAir: 0.01,
            render: { fillStyle: color }
        };

        switch (type) {
            case 'circle':
                return Bodies.circle(x, y, config.shapeSize/2, commonProps);
            case 'rectangle':
                return Bodies.rectangle(x, y, config.shapeSize, config.shapeSize, {
                    ...commonProps,
                    chamfer: { radius: 20, quality: 10 }
                });
            case 'triangle':
                return Bodies.polygon(x, y, 3, config.triangleRadius, {
                    ...commonProps,
                    chamfer: { radius: 15, quality: 10 }
                });
            default:
                return Bodies.rectangle(x, y, config.shapeSize, config.shapeSize, { ...commonProps, render: { fillStyle: '#dddddd' } });
        }
    }

    function initializeShapes() {
        const shapes = [
            { type: 'rectangle', color: '#000000' },
            { type: 'circle', color: '#000000' },
            { type: 'triangle', color: '#000000' }
        ];
        const matterShapes = [];

        shapes.forEach(shape => {
            const x = Math.random() * (config.width - config.shapeSize) + config.shapeSize/2;
            const y = Math.random() * (config.height/2) + config.shapeSize/2;
            
            const matterShape = createShape(shape.type, x, y, shape.color);
            if (matterShape) matterShapes.push(matterShape);
        });

        Composite.add(engine.world, matterShapes);
    }

    function setupMouseControl() {
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        // Add mouse move event listener to handle cursor changes
        render.canvas.addEventListener('mousemove', (event) => {
            const mousePosition = { x: event.offsetX, y: event.offsetY };
            const bodies = Composite.allBodies(engine.world);
            const hoveredBody = Query.point(bodies, mousePosition);
            
            if (hoveredBody.length > 0 && !hoveredBody[0].isStatic) {
                render.canvas.style.cursor = 'pointer';
            } else {
                render.canvas.style.cursor = 'default';
            }
        });
    }

    function handleResize() {
        const newWidth = container.clientWidth;
        const newHeight = Math.max(container.clientHeight, 300);
        
        config.width = newWidth;
        config.height = newHeight;

        render.bounds.max.x = newWidth;
        render.bounds.max.y = newHeight;
        render.options.width = newWidth;
        render.options.height = newHeight;
        render.canvas.width = newWidth;
        render.canvas.height = newHeight;

        const walls = createBoundaries();
        Composite.remove(engine.world, walls);
        Composite.add(engine.world, createBoundaries());
    }

    function checkAndResetShapes() {
        const bodies = Composite.allBodies(engine.world);
        const margin = 50; // Extra margin to ensure shapes are well within bounds

        bodies.forEach(body => {
            if (body.isStatic) return; // Skip walls

            const x = body.position.x;
            const y = body.position.y;
            const size = config.shapeSize;

            // Check if shape is outside boundaries
            if (x < -margin || x > config.width + margin || 
                y < -margin || y > config.height + margin) {
                
                // Reset position to center with random offset
                Body.setPosition(body, {
                    x: config.width/2 + (Math.random() - 0.5) * 100,
                    y: config.height/2 + (Math.random() - 0.5) * 100
                });
                
                // Reset velocity
                Body.setVelocity(body, { x: 0, y: 0 });
                Body.setAngularVelocity(body, 0);
            }
        });
    }

    const walls = createBoundaries();
    initializeShapes();
    setupMouseControl();
    
    Render.run(render);
    Runner.run(Runner.create(), engine);
    window.addEventListener('resize', handleResize);

    // Add the check to the engine's update loop
    Matter.Events.on(engine, 'beforeUpdate', checkAndResetShapes);

    // Allow scrolling when hovering over the canvas
    render.canvas.addEventListener('wheel', function(e) {
      // Do not preventDefault, let the event bubble for normal scrolling
    }, { passive: true });
});