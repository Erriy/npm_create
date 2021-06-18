const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;
const index = require('../index');

describe('index', ()=>{
    it('test', ()=>{
        index();
    })
})
