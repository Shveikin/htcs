


const conventor = require('./conventor');

const input = document.getElementById('html')

const onInput = function(){
    conventor(input.value, function(code){
        document.getElementById('output').value = code
        document.getElementById('view').innerHTML = input.value
    })
}

input.addEventListener('input', onInput)
onInput()