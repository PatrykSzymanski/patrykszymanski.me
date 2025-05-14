document.addEventListener('DOMContentLoaded', function () {
    const galleries = document.querySelectorAll('.lightgallery');
    galleries.forEach(gallery => {
        lightGallery(gallery, {
            selector: 'this',
            plugins: [lgZoom, lgFullscreen],
            download: false,
            infiniteZoom: true,
            counter: false,
            showZoomInOutIcons: true,
            actualSize: false,
            mode: 'lg-fade',
            speed: 500,
            escKey: true,
            hideBarsDelay: 3000,
            getCaptionFromTitleOrAlt: true,
            mobileSettings: {
                controls: true,
                showCloseIcon: true,
                download: false,
            },
        });
    });
});