document.addEventListener('DOMContentLoaded', async function () {
    const skinsList = document.getElementById('skinsList');
    const pagination = document.getElementById("pagination");
    const searchBar = document.querySelector('#searchBar');
    let db;

    // Definicion de constantes y variables para la paginación y filtrado
    const elementosPorPagina = 28;
    let paginaActual = 1;
    let skinsFiltradas = [];
    const pistols = ["Desert", "Five", "Glock-18", "P250", "USP-S", "Tec-9"];
    const midTier = ["MP9", "MP7", "P90", "Bizon", "P90", "UMP-45", "MAC-10", "XM1014", "MAG-7", "Negev", "MP5-SD", "Nova", "Recortada", "M248"];
    const rifles = ["AK-47", "FAMAS", "Galil", "M4A1-S", "M4A4", "G3SG1", "SSG", "AUG", "GSG31", "SG553", "SCAR-20", "AWP"];
    const knifes = ["Bayonet", "Mariposa", "Plegable", "Cuchillo-Destripador", "Cuchillo-del-cazador", "Karambit", "M9-Bayonet", "Dagas"];

    const csApi = "https://bymykel.github.io/CSGO-API/api/es-ES/skins.json";

    // Realizo un fetch para obtener los datos de la api
    const jsonData = await fetch(csApi)
        .then(response => response.json())
        .then(data => data);

    // Función para mostrar elementos en la página actual
    function mostrarElementos(pagina) {
        skinsList.innerHTML = "";
        const inicio = (pagina - 1) * elementosPorPagina;
        const fin = inicio + elementosPorPagina;

        for (let i = inicio; i < fin; i++) {
            if (i < skinsFiltradas.length) {
                const skin = skinsFiltradas[i];
                const skinCard = document.createElement('div');
                skinCard.classList.add('skin-card');

                const skinImage = document.createElement('img');
                skinImage.src = skin.image;
                skinImage.alt = skin.name;
                skinImage.classList.add('skin-image');

                const skinName = document.createElement('h3');
                skinName.textContent = skin.name;

                const skinDescription = document.createElement('p');
                skinDescription.textContent = skin.description;

                const buttonsContainer = document.createElement('div');
                buttonsContainer.classList.add('buttons-container');

                const updateSkin = document.createElement('button');
                updateSkin.textContent = 'Actualizar';
                updateSkin.classList.add('update-button');

                const deleteSkin = document.createElement('button');
                deleteSkin.textContent = 'Eliminar';
                deleteSkin.classList.add('delete-button');

                deleteSkin.addEventListener('click', function () {
                    const skinIndex = skinsFiltradas.indexOf(skin);
                    skinsFiltradas.splice(skinIndex, 1);
                    mostrarElementos(paginaActual);
                });

                updateSkin.addEventListener('click', function () {
                    actualizarSkin(apiSkin);
                });

                skinCard.appendChild(skinImage);
                skinCard.appendChild(skinName);
                skinCard.appendChild(skinDescription);
                skinCard.appendChild(buttonsContainer);
                buttonsContainer.appendChild(updateSkin);
                buttonsContainer.appendChild(deleteSkin);

                skinsList.appendChild(skinCard);
            }
        }
    }

    // Función para ordenar las skins por letra
    function sortSkins() {
        skinsList.innerHTML = "";
        skinsFiltradas.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Función para crear los enlaces de paginación
    function crearEnlacesPaginacion() {
        pagination.innerHTML = "";

        // Calcula la cantidad total de páginas
        const totalPaginas = Math.ceil(skinsFiltradas.length / elementosPorPagina);

        // Limita la cantidad de números en la paginación a 10
        let inicio = Math.max(1, paginaActual - 4);
        let fin = Math.min(inicio + 9, totalPaginas);

        // Ajusta el inicio si es necesario
        inicio = Math.max(1, fin - 9);

        // Botón "Anterior"
        const prevButton = document.createElement("a");
        prevButton.href = "#";
        prevButton.textContent = "Anterior";
        prevButton.classList.add("prev-next");
        prevButton.addEventListener("click", function () {
            if (paginaActual > 1) {
                paginaActual--;
                mostrarElementos(paginaActual);
                crearEnlacesPaginacion();
            }
        });

        pagination.appendChild(prevButton);

        for (let i = inicio; i <= fin; i++) {
            const enlace = document.createElement("a");
            enlace.href = "#";
            enlace.textContent = i;
            if (i === paginaActual) {
                enlace.classList.add("active");
            }
            enlace.addEventListener("click", function () {
                paginaActual = i;
                mostrarElementos(paginaActual);
                crearEnlacesPaginacion();
            });
            pagination.appendChild(enlace);
        }

        // Botón "Siguiente"
        const nextButton = document.createElement("a");
        nextButton.href = "#";
        nextButton.textContent = "Siguiente";
        nextButton.classList.add("prev-next");
        nextButton.addEventListener("click", function () {
            if (paginaActual < totalPaginas) {
                paginaActual++;
                mostrarElementos(paginaActual);
                crearEnlacesPaginacion();
            }
        });

        pagination.appendChild(nextButton);
    }

    // Bucle para procesar datos de la API
    jsonData.forEach(async function (apiSkin) {
        const updateSkin = document.createElement('button');
        updateSkin.textContent = 'Actualizar';
        updateSkin.classList.add('update-button');

        // Añadir el evento de clic para la actualización
        updateSkin.addEventListener('click', function () {
            actualizarSkin(apiSkin);
        });

        // Llamamos a la función para añadir la skin a IndexedDB
        await addSkinToIndexedDB(apiSkin);
    });
    
    mostrarArmas();

    // Funcion para abrir la base de datos
    function openDB() {
        const request = indexedDB.open('CSGO-Skins', 1);
    
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            db.createObjectStore('skins', { autoIncrement: true });
        };
    
        return new Promise((resolve, reject) => {
            request.onsuccess = function (event) {
                db = event.target.result;
                resolve(db);
            };
    
            request.onerror = function (event) {
                reject('Error al abrir la base de datos:' + event.target.error);
            };
        });
    }
    
// Función para añadir una skin a la base de datos mediante IndexedDB
function addSkinToIndexedDB(apiSkin) {
    // Abrir la base de datos
    return openDB().then(() => {
        // Devolver una nueva promesa
        return new Promise((resolve, reject) => {
            // Iniciar una transacción en modo de escritura ('readwrite')
            const transaction = db.transaction(['skins'], 'readwrite');
            // Obtener el almacén de objetos (Object Store) 'skins'
            const objectStore = transaction.objectStore('skins');

            // Abrir un cursor para recorrer los registros en el almacén
            const cursorRequest = objectStore.openCursor();

            // Manejar el evento cuando el cursor tiene éxito
            cursorRequest.onsuccess = function (event) {
                // Obtener el cursor actual
                const cursor = event.target.result;

                // Verificar si hay un cursor (registro) actual
                if (cursor) {
                    // Comprobar si la skin ya existe en la base de datos
                    if (cursor.value.name === apiSkin.name) {
                        console.log('La skin ya existe en la base de datos:', cursor.value);
                        // Resolver la promesa indicando que la operación se completó
                        resolve();
                    } else {
                        // Continuar al próximo registro
                        cursor.continue();
                    }
                } else {
                    // Si no hay más registros, añadir la nueva skin al almacén
                    const addRequest = objectStore.add(apiSkin);

                    // Manejar el éxito de añadir la skin
                    addRequest.onsuccess = function () {
                        console.log('Skin añadida a IndexedDB:', apiSkin);
                        // Resolver la promesa indicando que la operación se completó
                        resolve();
                    };

                    // Manejar errores al añadir la skin
                    addRequest.onerror = function (event) {
                        console.error('Error añadiendo skin a IndexedDB:', event.target.error);
                        // Rechazar la promesa con un mensaje de error
                        reject('Error añadiendo skin a IndexedDB: ' + event.target.error);
                    };
                }
            };

            // Manejar errores al abrir el cursor
            cursorRequest.onerror = function (event) {
                console.error('Error al abrir el cursor:', event.target.error);
                // Rechazar la promesa con un mensaje de error
                reject('Error al abrir el cursor: ' + event.target.error);
            };

            // Manejar la completitud exitosa de la transacción
            transaction.oncomplete = function () {
                console.log('Transacción completada.');
            };

            // Manejar la abortación de la transacción (si ocurre)
            transaction.onabort = function () {
                console.warn('La transacción ha sido abortada.');
                // Rechazar la promesa con un mensaje de aborto
                reject('La transacción ha sido abortada.');
            };
        });
    });
}
    
    
    // Esto es lo que saldra en el modal cuando se quiera actualizar la skin
    const apiSkin = {
        name: jsonData[0].name,
        description: jsonData[0].description,
        image: jsonData[0].image
    };

    // Llamamos a la función para anadir la skin a la base de datos
    addSkinToIndexedDB(apiSkin)
        .then(() => {
            console.log('Skin anadida a IndexedDB:', apiSkin);
            mostrarElementos(paginaActual);
            crearEnlacesPaginacion();
        })
        .catch(error => console.error(error));
    
    // Función para mostrar todas las armas
    function mostrarArmas () {
            skinsFiltradas = jsonData;
            paginaActual = 1;
            sortSkins();
            mostrarElementos(paginaActual);
            crearEnlacesPaginacion();
    }

    const mostrarTodo = document.getElementById('mostrarTodo');
    
    mostrarTodo.addEventListener('click', function (event) {
        event.preventDefault(); // Evitar que el enlace navegue a una nueva página
        mostrarArmas();
    });

    // Función para filtrar por Pistolas
    function filtrarPistolas() {
        const pistolas = jsonData.filter(skin => pistols.some(pistol => skin.name.includes(pistol)));
        skinsFiltradas = pistolas;
        paginaActual = 1;
        sortSkins();
        mostrarElementos(paginaActual);
        crearEnlacesPaginacion();
    }

    const pistolasLink = document.getElementById('pistolasLink');
    
    pistolasLink.addEventListener('click', function (event) {
        event.preventDefault(); // Evitar que el enlace navegue a una nueva página
        filtrarPistolas();
    });

    // Función para filtrar por Mid Tier
    function filtrarMidTier() {
        const midTierSkins = jsonData.filter(skin => midTier.some(midTier => skin.name.includes(midTier)));
        skinsFiltradas = midTierSkins;
        paginaActual = 1;
        sortSkins();
        mostrarElementos(paginaActual);
        crearEnlacesPaginacion();
    }
    
    const midTierLink = document.getElementById('midTierLink');
    
    midTierLink.addEventListener('click', function (event) {
        event.preventDefault();
        filtrarMidTier();
    });

    // Función para filtrar por Rifles
    function filtrarRifles() {
        const riflesSkins = jsonData.filter(skin => rifles.some(rifle => skin.name.includes(rifle)));
        skinsFiltradas = riflesSkins;
        paginaActual = 1;
        sortSkins();
        mostrarElementos(paginaActual);
        crearEnlacesPaginacion();
    }

    const riflesLink = document.getElementById('riflesLink');

    riflesLink.addEventListener('click', function (event) {
        event.preventDefault();
        filtrarRifles();    
    })

    // Función para filtrar por knifes
    function filtrarKnifes() {
        const knifesSkins = jsonData.filter(skin => knifes.some(knife => skin.name.includes(knife)));
        skinsFiltradas = knifesSkins;
        paginaActual = 1;
        sortSkins();
        mostrarElementos(paginaActual);
        crearEnlacesPaginacion();
    }

    const knifesLink = document.getElementById('knifesLink');

    knifesLink.addEventListener('click', function (event) {
        event.preventDefault();
        filtrarKnifes();
    })

    // Función para filtrar las skins por nombre
    function filtrarPorNombre() {
        const filtro = searchBar.value.toLowerCase();
        skinsFiltradas = jsonData.filter(skin => skin.name.toLowerCase().includes(filtro));
        paginaActual = 1;
        mostrarElementos(paginaActual);
        crearEnlacesPaginacion();
    }

    // Verificar si la barra de búsqueda tiene el valor "Search" al cargar la página
    if (searchBar.value !== "Search") {
        filtrarPorNombre();
    }

    // Asociar la función de filtrado al evento 'input' en la barra de búsqueda
    searchBar.addEventListener('input', filtrarPorNombre);
    
    // Función para actualizar la información de la skin
    function actualizarSkin(apiSkin) {
        const updateModal = new bootstrap.Modal(document.getElementById('updateModal'));
    
        const newNameInput = document.getElementById('newName');
        const newDescriptionInput = document.getElementById('newDescription');
        const newImageInput = document.getElementById('newImage');
    
        newNameInput.value = apiSkin.name;
        newDescriptionInput.value = apiSkin.description;
        newImageInput.value = apiSkin.image;
    
        updateModal.show();
    
        const updateForm = document.getElementById('updateForm');
        updateForm.addEventListener('submit', async function (event) {
            event.preventDefault();
    
            // Obtenemos los nuevos valores del formulario
            const newName = newNameInput.value;
            const newDescription = newDescriptionInput.value;
            const newImage = newImageInput.value;
    
            // Actualizamos la información en la base de datos
            await addSkinToIndexedDB({
                name: newName,
                description: newDescription,
                image: newImage
            });
    
            updateModal.hide();
    
            mostrarArmas();
        });
    }

    // Botón para crear una nueva skin
    const crearNuevaSkinBtn = document.getElementById('crearNuevaSkin');
    crearNuevaSkinBtn.addEventListener('click', abrirModalCrearNuevaSkin);

    async function abrirModalCrearNuevaSkin() {
        const nuevoSkinModal = new bootstrap.Modal(document.getElementById('nuevaSkinModal'));
        nuevoSkinModal.show();
    }

    const crearNuevaSkinForm = document.getElementById('crearNuevaSkinForm');
    crearNuevaSkinForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const nuevaSkin = {
            name: document.getElementById('nuevaSkinNombre').value,
            description: document.getElementById('nuevaSkinDescripcion').value,
            image: document.getElementById('nuevaSkinImagen').value
        };

        if (nuevaSkin.name && nuevaSkin.description && nuevaSkin.image) {
            // Añadir la nueva skin a IndexedDB
            await addSkinToIndexedDB(nuevaSkin);

            // Mostrar la nueva skin en la interfaz
            skinsFiltradas.push(nuevaSkin);
            mostrarElementos(paginaActual);
            crearEnlacesPaginacion();

            // Cerrar el modal después de agregar la skin
            const nuevoSkinModal = new bootstrap.Modal(document.getElementById('nuevaSkinModal'));
            nuevoSkinModal.hide();
        } else {
            alert('Debe proporcionar un nombre, descripción e URL de imagen válidos.');
        }
    });

    sortSkins();
    mostrarElementos(paginaActual);
    crearEnlacesPaginacion();
    addSkinToIndexedDB();

});
