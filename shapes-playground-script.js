// Module aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint,
    Events = Matter.Events;

const matterContainer = document.getElementById('matter-container');
const triggerElement = matterContainer; // Obserwujemy sam kontener Matter.js

let engine;
let render;
let runner;
let shapesInitialized = false;

function initShapes() {
    if (shapesInitialized || !matterContainer) {
        if (!matterContainer) console.error('Matter container not found!');
        return;
    }
    shapesInitialized = true;
    console.log('Initializing Matter.js shapes...');

    const containerWidth = matterContainer.clientWidth;
    // containerHeight będzie odczytane z CSS. Jeśli CSS ma height: 600px, to tyle tu będzie.
    const containerHeight = matterContainer.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) {
        console.error(`Matter container has zero dimensions (W: ${containerWidth}, H: ${containerHeight}). Check CSS or timing. Expected H: 600px.`);
        shapesInitialized = false;
        return;
    }
    console.log(`Matter container dimensions: Width=${containerWidth}, Height=${containerHeight}`);


    engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;

    render = Render.create({
        element: matterContainer,
        engine: engine,
        options: {
            width: containerWidth,   // Szerokość canvas = szerokość diva
            height: containerHeight, // Wysokość canvas = wysokość diva (oczekiwane 600px)
            wireframes: false,
            background: 'transparent'
        }
    });

    const shapes = [];
    // Dostosuj rozmiary i pozycje kształtów do nowej wysokości 600px
    // Użyj Math.min(containerWidth * 0.x, containerHeight * 0.y) dla responsywnych rozmiarów
    // lub stałych wartości, jeśli wolisz. Poniżej przykłady z lekkim dostosowaniem.
    let shapeBaseSize = Math.min(containerWidth, containerHeight) * 0.08; // Bazowy rozmiar kształtu

    shapes.push(Bodies.circle(containerWidth * 0.2, -150, shapeBaseSize * 1.2, { restitution: 0.6, render: { fillStyle: '#4A90E2' } }));
    shapes.push(Bodies.polygon(containerWidth * 0.35, -250, 7, shapeBaseSize * 1.1, { restitution: 0.5, render: { fillStyle: '#F5A623' }, chamfer: { radius: [8, 12, 12, 12, 18, 18, 8] } }));
    shapes.push(Bodies.polygon(containerWidth * 0.5, -100, 10, shapeBaseSize, { restitution: 0.7, render: { fillStyle: '#50E3C2' }, chamfer: { radius: 8 } }));
    shapes.push(Bodies.polygon(containerWidth * 0.7, -200, 6, shapeBaseSize * 1.15, { restitution: 0.4, render: { fillStyle: '#F8E71C' } }));
    shapes.push(Bodies.rectangle(containerWidth * 0.75, -300, shapeBaseSize * 1.5, shapeBaseSize * 1.8, { restitution: 0.5, render: { fillStyle: '#FFC0CB' }, chamfer: { radius: 12 } }));
    shapes.push(Bodies.polygon(containerWidth * 0.9, -150, 5, shapeBaseSize * 1.05, { restitution: 0.6, render: { fillStyle: '#B8E986' }, chamfer: { radius: [8, 18, 12, 18, 8] } }));


    const wallThickness = 60;
    const ground = Bodies.rectangle(
        containerWidth / 2,
        containerHeight + (wallThickness / 2) - 1,
        containerWidth + (wallThickness * 2),
        wallThickness,
        { isStatic: true, render: { visible: false }, label: 'ground' }
    );

    const wallLeft = Bodies.rectangle(
        -(wallThickness / 2) + 1,
        containerHeight / 2,
        wallThickness,
        containerHeight, // Ściany boczne powinny mieć wysokość kontenera
        { isStatic: true, render: { visible: false }, label: 'wallLeft' }
    );

    const wallRight = Bodies.rectangle(
        containerWidth + (wallThickness / 2) - 1,
        containerHeight / 2,
        wallThickness,
        containerHeight, // Ściany boczne powinny mieć wysokość kontenera
        { isStatic: true, render: { visible: false }, label: 'wallRight' }
    );

    const ceiling = Bodies.rectangle(
        containerWidth / 2,
        -(wallThickness / 2) + 1,
        containerWidth + (wallThickness * 2),
        wallThickness,
        { isStatic: true, render: { visible: false }, label: 'ceiling' }
    );

    Composite.add(world, [...shapes, ground, wallLeft, wallRight, ceiling]);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false }
        }
    });
    Composite.add(world, mouseConstraint);

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);

    if (matterContainer) {
        matterContainer.classList.add('active');
    }
}

// --- Intersection Observer ---
if (triggerElement) {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!shapesInitialized) {
                    console.log("Matter.js container is visible, initializing shapes.");
                    initShapes();
                }
                // obs.unobserve(entry.target); // Odkomentuj, jeśli chcesz zatrzymać obserwację po pierwszym razie
            }
        });
    }, observerOptions);

    observer.observe(triggerElement);
} else {
    console.warn('Trigger element for Matter.js (matter-container) not found.');
}

// --- Handle window resize ---
window.addEventListener('resize', () => {
    if (!render || !engine || !matterContainer || !shapesInitialized) return;

    console.log('Resizing Matter.js canvas and boundaries...');

    const newContainerWidth = matterContainer.clientWidth;
    // Wysokość powinna być stała 600px z CSS, ale odczytujemy ją na wszelki wypadek
    // gdyby CSS dynamicznie się zmienił (choć w tym scenariuszu nie powinien dla wysokości)
    const newContainerHeight = matterContainer.clientHeight;

    if (newContainerWidth === 0 || newContainerHeight === 0) {
        console.warn('Container dimensions became zero on resize. Skipping Matter.js resize.');
        return;
    }
     console.log(`Matter container RESIZED to: Width=${newContainerWidth}, Height=${newContainerHeight}`);


    render.canvas.width = newContainerWidth;
    render.canvas.height = newContainerHeight; // Użyj odczytanej wysokości, która powinna być 600px
    render.options.width = newContainerWidth;
    render.options.height = newContainerHeight; // Użyj odczytanej wysokości

    const wallThickness = 60; // Utrzymaj spójność

    const ground = Composite.allBodies(engine.world).find(body => body.label === 'ground');
    const wallLeft = Composite.allBodies(engine.world).find(body => body.label === 'wallLeft');
    const wallRight = Composite.allBodies(engine.world).find(body => body.label === 'wallRight');
    const ceiling = Composite.allBodies(engine.world).find(body => body.label === 'ceiling');

    // Aktualizacja granic - WAŻNE: Pozycje i wierzchołki muszą być przeliczone dla NOWEJ newContainerHeight
    if (ground) {
        Matter.Body.setPosition(ground, { x: newContainerWidth / 2, y: newContainerHeight + (wallThickness / 2) - 1 });
        Matter.Body.setVertices(ground, Matter.Vertices.fromPath(`L 0 0 L ${newContainerWidth + (wallThickness * 2)} 0 L ${newContainerWidth + (wallThickness * 2)} ${wallThickness} L 0 ${wallThickness}`));
        Matter.Body.setPosition(ground, { x: newContainerWidth / 2 - ((newContainerWidth + (wallThickness * 2)) / 2), y: newContainerHeight + (wallThickness / 2) - 1 }); // Korekta po setVertices
        Matter.Body.setPosition(ground, { x: newContainerWidth / 2, y: newContainerHeight + (wallThickness / 2) - 1 }); // Ustawienie na środku
    }
    if (wallLeft) {
        Matter.Body.setPosition(wallLeft, { x: -(wallThickness / 2) + 1, y: newContainerHeight / 2 });
        Matter.Body.setVertices(wallLeft, Matter.Vertices.fromPath(`L 0 0 L ${wallThickness} 0 L ${wallThickness} ${newContainerHeight} L 0 ${newContainerHeight}`));
        Matter.Body.setPosition(wallLeft, { x: -(wallThickness / 2) + 1 + (wallThickness/2), y: newContainerHeight / 2 });
        Matter.Body.setPosition(wallLeft, { x: -(wallThickness / 2) + 1, y: newContainerHeight / 2 }); // Ustawienie przy krawędzi
    }
    if (wallRight) {
        Matter.Body.setPosition(wallRight, { x: newContainerWidth + (wallThickness / 2) - 1, y: newContainerHeight / 2 });
        Matter.Body.setVertices(wallRight, Matter.Vertices.fromPath(`L 0 0 L ${wallThickness} 0 L ${wallThickness} ${newContainerHeight} L 0 ${newContainerHeight}`));
        Matter.Body.setPosition(wallRight, { x: newContainerWidth + (wallThickness / 2) - 1 - (wallThickness/2), y: newContainerHeight / 2 });
        Matter.Body.setPosition(wallRight, { x: newContainerWidth + (wallThickness / 2) - 1, y: newContainerHeight / 2 }); // Ustawienie przy krawędzi
    }
    if (ceiling) {
        Matter.Body.setPosition(ceiling, { x: newContainerWidth / 2, y: -(wallThickness / 2) + 1 });
        Matter.Body.setVertices(ceiling, Matter.Vertices.fromPath(`L 0 0 L ${newContainerWidth + (wallThickness * 2)} 0 L ${newContainerWidth + (wallThickness * 2)} ${wallThickness} L 0 ${wallThickness}`));
        Matter.Body.setPosition(ceiling, { x: newContainerWidth / 2 - ((newContainerWidth + (wallThickness * 2)) / 2), y: -(wallThickness / 2) + 1 });
        Matter.Body.setPosition(ceiling, { x: newContainerWidth / 2, y: -(wallThickness / 2) + 1 }); // Ustawienie na środku
    }
});