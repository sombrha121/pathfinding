/*
Creado por Javier Muñiz @javianmuniz para
el canal de YouTube "Programar es increíble"

 
 
Modificado para permitir selección interactiva de origen y destino
*/

var canvas;
var ctx;
var FPS = 50;

//ESCENARIO / TABLERO
var columnas = 25;
var filas = 25;
var escenario;  //matriz del nivel

//TILES
var anchoT;
var altoT;

const muro = '#000000';
const tierra = '#777777';
const colorOrigen = '#00FF00'; // Verde
const colorDestino = '#FF0000'; // Rojo

//RUTA
var principio = null;
var fin = null;

var openSet = [];
var closedSet = [];

var camino = [];
var terminado = false;

// Variables para selección interactiva
var seleccionandoOrigen = true;

//CREAMOS UN ARRAY 2D
function creaArray2D(f,c){
  var obj = new Array(f);
  for(a=0; a<f; a++){
    obj[a] = new Array(c);
  }
  return obj;
}

function heuristica(a,b){
  var x = Math.abs(a.x - b.x);
  var y = Math.abs(a.y - b.y);
  var dist = x + y;
  return dist;
}

function borraDelArray(array,elemento){
  for(i=array.length-1; i>=0; i--){
    if(array[i] == elemento){
      array.splice(i,1);
    }
  }
}

function Casilla(x,y){
  //POSICIÓN
  this.x = x;
  this.y = y;

  //TIPO (obstáculo=1, vacío=0)
  this.tipo = 0;
  // obstaculo puede salir dentro de 0 a 4
  var aleatorio = Math.floor(Math.random()*5);  // 0-4
  if(aleatorio == 1)
      this.tipo = 1;

  //PESOS o como de lejo estamos de la meta 
  this.f = 0;  //coste total (g+h) 
  this.g = 0;  //pasos dados
  this.h = 0;  //heurística (estimación de lo que queda)

  this.vecinos = [];
  this.padre = null;

  //MÉTODO QUE CALCULA SUS VECNIOS
  this.addVecinos = function(){
    if(this.x > 0)
      this.vecinos.push(escenario[this.y][this.x-1]);   //vecino izquierdo

    if(this.x < filas-1)
      this.vecinos.push(escenario[this.y][this.x+1]);   //vecino derecho

    if(this.y > 0)
      this.vecinos.push(escenario[this.y-1][this.x]);   //vecino de arriba

    if(this.y < columnas-1)
      this.vecinos.push(escenario[this.y+1][this.x]); //vecino de abajo
  }

  //MÉTODO QUE DIBUJA LA CASILLA
  this.dibuja = function(){
    var color;

    if(this.tipo == 0)
      color = tierra;
    if(this.tipo == 1)
      color = muro;

    //DIBUJAMOS EL CUADRO EN EL CANVAS
    ctx.fillStyle = color;
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }

  //DIBUJA OPENSET
  this.dibujaOS = function(){
    ctx.fillStyle = '#008000';
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }

  //DIBUJA CLOSEDSET
  this.dibujaCS = function(){
    ctx.fillStyle = '#800000';
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }

  //DIBUJA CAMINO
  this.dibujaCamino = function(){
    ctx.fillStyle = '#00FFFF';  //cyan
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }
}

function manejarClick(evento) {
  var rect = canvas.getBoundingClientRect();
  var x = Math.floor((evento.clientX - rect.left) / anchoT);
  var y = Math.floor((evento.clientY - rect.top) / altoT);
  
  // Verificar que las coordenadas están dentro del rango
  if (x >= 0 && x < columnas && y >= 0 && y < filas) {
    var casilla = escenario[y][x];
    
    // Solo permitir seleccionar casillas que no son muros
    if (casilla.tipo !== 1) {
      if (seleccionandoOrigen) {
        principio = casilla;
        console.log("Origen seleccionado en: (" + x + ", " + y + ")");
        seleccionandoOrigen = false; // Cambiar a selección de destino
      } else {
        fin = casilla;
        console.log("Destino seleccionado en: (" + x + ", " + y + ")");
        seleccionandoOrigen = true; // Cambiar a selección de origen para el próximo ciclo
        
        // Reiniciar el algoritmo con los nuevos puntos
        reiniciarBusqueda();
      }
    }
  }
}

function reiniciarBusqueda() {
  openSet = [];
  closedSet = [];
  camino = [];
  terminado = false;
  
  if (principio) {
    openSet.push(principio);
  }
}

function inicializa(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  //CALCULAMOS EL TAMAÑO DE LOS TILES (Proporcionalmente)
  anchoT = parseInt(canvas.width/columnas);
  altoT = parseInt(canvas.height/filas);

  //CREAMOS LA MATRIZ
  escenario = creaArray2D(filas,columnas);

  //AÑADIMOS LOS OBJETOS CASILLAS
  for(i=0;i<filas;i++){
    for(j=0;j<columnas;j++){
        escenario[i][j] = new Casilla(j,i)
    }
  }

  //AÑADIMOS LOS VECINOS
  for(i=0;i<filas;i++){
    for(j=0;j<columnas;j++){
        escenario[i][j].addVecinos();
    }
  }

  // Agregar evento de clic al canvas
  canvas.addEventListener('click', manejarClick, false);

  //EMPEZAMOS A EJECUTAR EL BUCLE PRINCIPAL
  setInterval(function(){principal();},1000/FPS);
}

function dibujaEscenario(){
  // Dibujar todas las casillas
  for(i=0;i<filas;i++){
    for(j=0;j<columnas;j++){
        escenario[i][j].dibuja();
    }
  }

  // Dibujar origen y destino si están seleccionados
  if (principio) {
    ctx.fillStyle = colorOrigen;
    ctx.fillRect(principio.x*anchoT, principio.y*altoT, anchoT, altoT);
  }
  
  if (fin) {
    ctx.fillStyle = colorDestino;
    ctx.fillRect(fin.x*anchoT, fin.y*altoT, anchoT, altoT);
  }

  //DIBUJA OPENSET
  for(i=0; i<openSet.length; i++){
    openSet[i].dibujaOS();
  }

  //DIBUJA CLOSEDSET
  for(i=0; i<closedSet.length; i++){
    closedSet[i].dibujaCS();
  }

  for(i=0; i<camino.length; i++){
    camino[i].dibujaCamino();
  }
}

function borraCanvas(){
  canvas.width = canvas.width;
  canvas.height = canvas.height;
}

function algoritmo(){
  // Solo ejecutar si tenemos ambos puntos seleccionados
  if (!principio || !fin) return;

  //SEGUIMOS HASTA ENCONTRAR SOLUCIÓN
  if(terminado!=true){
    //SEGUIMOS SI HAY AlGO EN OPENSET
    if(openSet.length>0){
      var ganador = 0;  //índice o posición dentro del array openset del ganador

      //evaluamos que OpenSet tiene un menor coste / esfuerzo
      for(i=0; i<openSet.length; i++){
        if(openSet[i].f < openSet[ganador].f){
          ganador = i;
        }
      }

      //Analizamos la casilla ganadora
      var actual = openSet[ganador];

      //SI HEMOS LLEGADO AL FINAL BUSCAMOS EL CAMINO DE VUELTA
      if(actual === fin){
        var temporal = actual;
        camino.push(temporal);

        while(temporal.padre!=null){
          temporal = temporal.padre;
          camino.push(temporal);
        }

        console.log('camino encontrado');
        terminado = true;
      }
      //SI NO HEMOS LLEGADO AL FINAL, SEGUIMOS
      else{
        borraDelArray(openSet,actual);
        closedSet.push(actual);

        var vecinos = actual.vecinos;

        //RECORRO LOS VECINOS DE MI GANADOR
        for(i=0; i<vecinos.length; i++){
          var vecino = vecinos[i];

          //SI EL VECINO NO ESTÁ EN CLOSEDSET Y NO ES UNA PARED, HACEMOS LOS CÁLCULOS
          if(!closedSet.includes(vecino) && vecino.tipo!=1){
            var tempG = actual.g + 1;

            //si el vecino está en OpenSet y su peso es mayor
            if(openSet.includes(vecino)){
              if(tempG < vecino.g){
                vecino.g = tempG;     //camino más corto
              }
            }
            else{
              vecino.g = tempG;
              openSet.push(vecino);
            }

            //ACTUALIZAMOS VALORES
            vecino.h = heuristica(vecino,fin);
            vecino.f = vecino.g + vecino.h;

            //GUARDAMOS EL PADRE (DE DÓNDE VENIMOS)
            vecino.padre = actual;
          }
        }
      }
    }
    else{
      console.log('No hay un camino posible');
      terminado = true;   //el algoritmo ha terminado
    }
  }
}

function principal(){
  borraCanvas();
  
  // Solo ejecutar el algoritmo si tenemos ambos puntos seleccionados
  if (principio && fin) {
    algoritmo();
  }
  
  dibujaEscenario();
}