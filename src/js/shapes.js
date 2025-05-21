document.addEventListener('DOMContentLoaded', () => {
    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Body, Query, Events, World } = Matter;
    const container = document.getElementById('shapes-container');
    if (!container) return;

    const WALL_THICKNESS = 50;
    const MIN_HEIGHT = 300;
    const SHAPE_SIZE = 180;
    const TRIANGLE_RADIUS = 120;
    const RESET_MARGIN = 50;
    const RESET_THROTTLE = 100;

    let currentShapeColor = '';

    const config = {
        width: container.clientWidth,
        height: Math.max(container.clientHeight, MIN_HEIGHT),
        update() {
            this.width = container.clientWidth;
            this.height = Math.max(container.clientHeight, MIN_HEIGHT);
            return this;
        }
    };

    const engine = Engine.create({
        positionIterations: 6,
        velocityIterations: 4
    });
    engine.world.gravity.y = 0.4;

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

    function getShapeColor() {
        const newColor = getComputedStyle(document.documentElement).getPropertyValue('--color-shape').trim() || '#000000';
        if (newColor !== currentShapeColor) {
            currentShapeColor = newColor;
        }
        return currentShapeColor;
    }

    const commonShapeProps = {
        restitution: 0.3,
        friction: 0.1,
        frictionAir: 0.01
    };

    function createShape(type, x, y, color) {
        const renderProps = { render: { fillStyle: color } };
        const props = { ...commonShapeProps, ...renderProps };
        
        switch (type) {
            case 'circle':
                return Bodies.circle(x, y, SHAPE_SIZE / 2, props);
            case 'rectangle':
                return Bodies.rectangle(x, y, SHAPE_SIZE, SHAPE_SIZE, {
                    ...props,
                    chamfer: { radius: 16, quality: 10 }
                });
            case 'triangle':
                return Bodies.polygon(x, y, 3, TRIANGLE_RADIUS, {
                    ...props,
                    chamfer: { radius: 16, quality: 10 }
                });
            default:
                return Bodies.rectangle(x, y, SHAPE_SIZE, SHAPE_SIZE, { ...props, render: { fillStyle: '#dddddd' } });
        }
    }

    const boundaryOptions = { isStatic: true, render: { visible: false } };
    
    function createBoundaries(width, height) {
        return [
            Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2, width, WALL_THICKNESS, boundaryOptions),
            Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width, WALL_THICKNESS, boundaryOptions),
            Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, boundaryOptions),
            Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, boundaryOptions)
        ];
    }

    let dynamicBodies = [];
    let boundaries = [];

    function updateDynamicBodiesCache() {
        dynamicBodies = Composite.allBodies(engine.world).filter(body => !body.isStatic);
    }

    let shapesInitialized = false;
    function initializeShapesOnce() {
        if (!shapesInitialized) {
            initializeShapes();
            shapesInitialized = true;
        }
    }

    function initializeShapes() {
        const color = getShapeColor();
        const types = ['rectangle', 'circle', 'triangle'];
        const shapes = [];
        
        for (let i = 0; i < types.length; i++) {
            const x = Math.random() * (config.width - SHAPE_SIZE) + SHAPE_SIZE / 2;
            const y = Math.random() * (config.height / 2) + SHAPE_SIZE / 2;
            shapes.push(createShape(types[i], x, y, color));
        }
        
        Composite.add(engine.world, shapes);
        updateDynamicBodiesCache();
    }

    const resetPosition = { x: 0, y: 0 };
    const zeroVelocity = { x: 0, y: 0 };
    
    function resetShapeIfOutOfBounds(body) {
        const { width, height } = config;
        const { x, y } = body.position;
        
        if (x < -RESET_MARGIN || x > width + RESET_MARGIN ||
            y < -RESET_MARGIN || y > height + RESET_MARGIN) {
            resetPosition.x = width / 2 + (Math.random() - 0.5) * 100;
            resetPosition.y = height / 2 + (Math.random() - 0.5) * 100;
            Body.setPosition(body, resetPosition);
            Body.setVelocity(body, zeroVelocity);
            Body.setAngularVelocity(body, 0);
        }
    }

    let lastResetTime = 0;
    function throttledCheckAndResetShapes() {
        const now = Date.now();
        if (now - lastResetTime > RESET_THROTTLE) {
            for (let i = 0; i < dynamicBodies.length; i++) {
                resetShapeIfOutOfBounds(dynamicBodies[i]);
            }
            lastResetTime = now;
        }
    }

    function setupMouseControl() {
        const mouse = Mouse.create(render.canvas);
        
        render.canvas.removeEventListener('mousewheel', mouse.mousewheel);
        render.canvas.removeEventListener('DOMMouseScroll', mouse.mousewheel);
        
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: { 
                stiffness: 0.2, 
                render: { visible: false } 
            }
        });
        
        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;
        
        render.canvas.addEventListener('mousemove', (event) => {
            const mousePosition = { x: event.offsetX, y: event.offsetY };
            const hoveredBodies = Query.point(dynamicBodies, mousePosition);
            render.canvas.style.cursor = hoveredBodies.length > 0 ? 'pointer' : 'default';
        }, { passive: true });
        
        render.canvas.addEventListener('wheel', (event) => {
            const originalStiffness = mouseConstraint.constraint.stiffness;
            
            mouseConstraint.constraint.stiffness = 0;
            
            setTimeout(() => {
                mouseConstraint.constraint.stiffness = originalStiffness;
            }, 50);
        }, { passive: true });
        
        return mouseConstraint;
    }

    let resizeRequested = false;
    function handleResize() {
        if (!resizeRequested) {
            resizeRequested = true;
            requestAnimationFrame(() => {
                resizeRequested = false;
                config.update();
                const { width, height } = config;
                
                render.bounds.max.x = width;
                render.bounds.max.y = height;
                render.options.width = width;
                render.options.height = height;
                render.canvas.width = width;
                render.canvas.height = height;
                
                Composite.remove(engine.world, boundaries);
                boundaries = createBoundaries(width, height);
                Composite.add(engine.world, boundaries);
            });
        }
    }

    function updateShapeColors() {
        const color = getShapeColor();
        for (let i = 0; i < dynamicBodies.length; i++) {
            dynamicBodies[i].render.fillStyle = color;
        }
    }

    boundaries = createBoundaries(config.width, config.height);
    Composite.add(engine.world, boundaries);

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) {
                initializeShapesOnce();
                obs.disconnect();
            }
        }, { threshold: 0.1 });
        observer.observe(container);
    } else {
        initializeShapesOnce();
    }

    setupMouseControl();

    const runner = Runner.create();
    Render.run(render);
    Runner.run(runner, engine);

    window.addEventListener('resize', handleResize);
    
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', updateShapeColors);

    Events.on(engine, 'beforeUpdate', throttledCheckAndResetShapes);

    function cleanup() {
        window.removeEventListener('resize', handleResize);
        darkModeMediaQuery.removeEventListener('change', updateShapeColors);
        Events.off(engine, 'beforeUpdate', throttledCheckAndResetShapes);
        Runner.stop(runner);
        Render.stop(render);
        World.clear(engine.world);
        Engine.clear(engine);
        render.canvas.remove();
        render.canvas = null;
        render.context = null;
        render.textures = {};
    }

    container.cleanup = cleanup;
});