document.addEventListener('DOMContentLoaded', () => {
    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Body, Query, Events } = Matter;
    const container = document.getElementById('shapes-container');
    if (!container) return;

    const WALL_THICKNESS = 50;
    const MIN_HEIGHT = 300;
    const SHAPE_SIZE = 180;
    const TRIANGLE_RADIUS = 120;
    const RESET_MARGIN = 50;
    const RESET_THROTTLE = 100;

    const config = {
        get width() { return container.clientWidth; },
        get height() { return Math.max(container.clientHeight, MIN_HEIGHT); }
    };

    const engine = Engine.create();
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
        return getComputedStyle(document.documentElement).getPropertyValue('--color-shape').trim() || '#000000';
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
                return Bodies.circle(x, y, SHAPE_SIZE / 2, commonProps);
            case 'rectangle':
                return Bodies.rectangle(x, y, SHAPE_SIZE, SHAPE_SIZE, {
                    ...commonProps,
                    chamfer: { radius: 16, quality: 10 }
                });
            case 'triangle':
                return Bodies.polygon(x, y, 3, TRIANGLE_RADIUS, {
                    ...commonProps,
                    chamfer: { radius: 16, quality: 10 }
                });
            default:
                return Bodies.rectangle(x, y, SHAPE_SIZE, SHAPE_SIZE, { ...commonProps, render: { fillStyle: '#dddddd' } });
        }
    }

    function createBoundaries(width, height) {
        return [
            Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2, width, WALL_THICKNESS, { isStatic: true, render: { visible: false } }),
            Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width, WALL_THICKNESS, { isStatic: true, render: { visible: false } }),
            Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, { isStatic: true, render: { visible: false } }),
            Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, { isStatic: true, render: { visible: false } })
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
        const shapes = types.map(type => {
            const x = Math.random() * (config.width - SHAPE_SIZE) + SHAPE_SIZE / 2;
            const y = Math.random() * (config.height / 2) + SHAPE_SIZE / 2;
            return createShape(type, x, y, color);
        });
        Composite.add(engine.world, shapes);
        updateDynamicBodiesCache();
    }

    function resetShapeIfOutOfBounds(body) {
        const { width, height } = config;
        const { x, y } = body.position;
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

    let lastResetTime = 0;
    function throttledCheckAndResetShapes() {
        const now = Date.now();
        if (now - lastResetTime > RESET_THROTTLE) {
            dynamicBodies.forEach(resetShapeIfOutOfBounds);
            lastResetTime = now;
        }
    }

    function setupMouseControl() {
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        render.canvas.addEventListener('mousemove', (event) => {
            const mousePosition = { x: event.offsetX, y: event.offsetY };
            const hoveredBody = Query.point(dynamicBodies, mousePosition);
            render.canvas.style.cursor = (hoveredBody.length > 0) ? 'pointer' : 'default';
        });
    }

    let resizeRequested = false;
    function handleResize() {
        if (!resizeRequested) {
            resizeRequested = true;
            requestAnimationFrame(() => {
                resizeRequested = false;
                const width = config.width;
                const height = config.height;
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
        dynamicBodies.forEach(body => {
            body.render.fillStyle = color;
        });
    }

    boundaries = createBoundaries(config.width, config.height);
    Composite.add(engine.world, boundaries);

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    initializeShapesOnce();
                    obs.disconnect();
                }
            });
        }, { threshold: 0.1 });
        observer.observe(container);
    } else {
        initializeShapesOnce();
    }

    setupMouseControl();

    Render.run(render);
    Runner.run(Runner.create(), engine);

    window.addEventListener('resize', handleResize);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateShapeColors);

    Events.on(engine, 'beforeUpdate', throttledCheckAndResetShapes);

    render.canvas.addEventListener('wheel', function(e) {}, { passive: true });
});