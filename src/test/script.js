document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('imageUploadForm');
    const message = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        try {
            const response = await fetch('http://192.168.29.71:5000/api/admin/view/gallery/addImage', {
                method: 'POST',
                body: formData
            });
            console.log("response",response,"forndata",formData)
            const data = await response.json();
            console.log("data from addimage",data)
            if (response.ok) {
                message.textContent = data.message;
            } else {
                throw new Error(data.error.message);
            }
        } catch (error) {
            message.textContent = `Error: ${error.message}`;
        }
    });
});
