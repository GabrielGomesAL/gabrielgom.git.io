const cyberCanvas = document.getElementById("cyber3d");
const cyberHero = document.querySelector(".hero");
const cyberReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!cyberCanvas || cyberReduceMotion || !window.THREE) {
    cyberHero?.classList.add("is-3d-fallback");
} else {
    try {
        initCyberScene(window.THREE);
    } catch (error) {
        cyberHero?.classList.add("is-3d-fallback");
    }
}

function initCyberScene(THREE) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
    const renderer = new THREE.WebGLRenderer({
        canvas: cyberCanvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
    });

    const pointer = new THREE.Vector2(0, 0);
    const group = new THREE.Group();
    const widthSegments = 28;
    const heightSegments = 18;

    scene.add(group);
    camera.position.set(0, 0.4, 13);

    const purple = new THREE.Color("#b46cff");
    const green = new THREE.Color("#9cff2e");
    const pink = new THREE.Color("#ff4fd8");

    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.45, 1),
        new THREE.MeshBasicMaterial({
            color: purple,
            wireframe: true,
            transparent: true,
            opacity: 0.72
        })
    );
    core.position.set(3.8, 0.2, 0);
    group.add(core);

    const tunnel = new THREE.Mesh(
        new THREE.TorusKnotGeometry(2.2, 0.018, 180, 8, 2, 5),
        new THREE.MeshBasicMaterial({
            color: green,
            transparent: true,
            opacity: 0.92
        })
    );
    tunnel.position.set(3.8, 0.2, -0.15);
    group.add(tunnel);

    const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.25, 0.012, 8, 160),
        new THREE.MeshBasicMaterial({
            color: pink,
            transparent: true,
            opacity: 0.55
        })
    );
    outerRing.position.copy(core.position);
    outerRing.rotation.x = Math.PI / 2.7;
    group.add(outerRing);

    const gridLines = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({
        color: "#7c3cff",
        transparent: true,
        opacity: 0.22
    });

    for (let x = 0; x <= widthSegments; x += 1) {
        const normalized = x / widthSegments - 0.5;
        const points = [
            new THREE.Vector3(normalized * 18, -5.2, -3),
            new THREE.Vector3(normalized * 18, 5.2, -3)
        ];
        gridLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
    }

    for (let y = 0; y <= heightSegments; y += 1) {
        const normalized = y / heightSegments - 0.5;
        const points = [
            new THREE.Vector3(-9, normalized * 9, -3),
            new THREE.Vector3(9, normalized * 9, -3)
        ];
        gridLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
    }

    gridLines.rotation.x = -0.55;
    gridLines.position.y = -1.1;
    group.add(gridLines);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 18;
        positions[i3 + 1] = (Math.random() - 0.5) * 8;
        positions[i3 + 2] = (Math.random() - 0.5) * 8;

        const color = i % 3 === 0 ? green : i % 3 === 1 ? purple : pink;
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(
        particlesGeometry,
        new THREE.PointsMaterial({
            size: 0.045,
            vertexColors: true,
            transparent: true,
            opacity: 0.78
        })
    );
    group.add(particles);

    const linkGeometry = new THREE.BufferGeometry();
    const linkPositions = [];
    for (let i = 0; i < 38; i += 1) {
        const x = 3.8 + Math.cos(i * 0.54) * (2.5 + (i % 4) * 0.22);
        const y = 0.2 + Math.sin(i * 0.54) * (1.7 + (i % 3) * 0.18);
        linkPositions.push(
            new THREE.Vector3(x, y, -0.1),
            new THREE.Vector3(x + (Math.random() - 0.5) * 2.5, y + (Math.random() - 0.5) * 1.4, -2.2)
        );
    }
    linkGeometry.setFromPoints(linkPositions);
    const links = new THREE.LineSegments(
        linkGeometry,
        new THREE.LineBasicMaterial({
            color: "#9cff2e",
            transparent: true,
            opacity: 0.25
        })
    );
    group.add(links);

    function resize() {
        const rect = cyberCanvas.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.8);

        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = width < 760 ? 16 : 13;
        group.position.x = width < 760 ? -0.8 : 0;
        camera.updateProjectionMatrix();
    }

    function animate(time = 0) {
        const t = time * 0.001;

        core.rotation.x = t * 0.22;
        core.rotation.y = t * 0.34;
        tunnel.rotation.x = t * 0.28;
        tunnel.rotation.y = t * 0.18;
        outerRing.rotation.z = t * 0.18;
        particles.rotation.y = t * 0.035;
        links.rotation.z = Math.sin(t * 0.45) * 0.04;

        group.rotation.y += (pointer.x * 0.18 - group.rotation.y) * 0.035;
        group.rotation.x += (-pointer.y * 0.08 - group.rotation.x) * 0.035;

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", (event) => {
        pointer.x = event.clientX / window.innerWidth - 0.5;
        pointer.y = event.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    resize();
    animate();
}
