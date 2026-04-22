//Selecionar el elemento del DOM que queremos manipular
const mainTitle = document.getElementById('titulo-principal');

//Selecionar los botones
const changeTitleButton = document.getElementById('cambia-titulo');//Boton oara cambiar titulo
const resetTitleButton = document.getElementById('reinicia');//Boton para reiniciar el titulo

//Funcion para cambiar el texto dek titulo
changeTitleButton.addEventListener('click',()=>{
    //Cambiamos el texto del titulo
    mainTitle.textContent ='Asi Funciona el DOM!!!'
    //Cambiamos el color del texto usando botstrap
    mainTitle.classList.add('text-success');
});

//Funcion para reiniciar el titulo al estado original
resetTitleButton.addEventListener('click',()=>{
    //Restauramos el texto original dek titulo
    mainTitle.textContent ='Hola, Mundo!!';
    //Quitamos el color de texto agregado
    mainTitle.classList.add('text-success');
});