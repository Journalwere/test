document.addEventListener('DOMContentLoaded', function() {
    const earth = document.querySelector('.earth');

    let rotation = 0;

    function spinEarth() {
        rotation += 0.1;
        earth.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        requestAnimationFrame(spinEarth);
    }

    spinEarth();
});

