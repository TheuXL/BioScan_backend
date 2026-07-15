Arquitetura para os tests

apis/
└── function-name/
    ├── Function-name.test.js
    ├── README.md

    function-name/
    ├── Function-name.test.js
    └── README.md
    function-name/
    ├── Function-name.test.js
    └── README.md

Não deve pular ou simular uma resposta correta, o test deve ser sempre 100% e status 200OK

npm test -- src/__tests__/NasaFire/NasaFire.test.js
npm test -- src/__tests__/NasaSeaLevel/NasaSeaLevel.test.js

