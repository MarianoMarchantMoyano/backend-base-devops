import { describe, test, expect } from "@jest/globals";
import app from "../src/server.js";
import request from "supertest";
import { configuration } from "../src/config.js";

describe("Test Suite App", () => {

    test("endpoint /", () => {
        expect(1 + 1).toBe(2);
    });

    test("endpoint key", () => {
        expect(1 + 1).toBe(2);
    });

    test("endpoint /palindromo", () => {
        expect(1 + 1).toBe(2);
    });

    test("endpoint /primo", () => {
        expect(1 + 1).toBe(2);
    });

 
    test("test de endpoint /", async () => {
        return await request(app)
            .get("/")
            .expect("Content-Type", /text/)
            .expect(200)
            .then((response) => {
                expect(response.text).toBe(`Hola, esta api fue configurada por el usuario ${configuration.username}`);
            })
    });

    test("test de key /", async () => {
        return await request(app)
            .get("/key")
            .expect("Content-Type", /text/)
            .expect(200)
            .then((response) => {
                expect(response.text).toBe(`Hola, esta api contiene la siguiente api-key: ${configuration.apiKey}`);
            })
    });
    

    test("test de endpoint /palindromo/:frase", async () => {
        const frase = 'radar';  
        return await request(app)
            .get(`/palindromo/${frase}`)
            .expect("Content-Type", /text/)
            .expect(200)
            .then((response) => {
                expect(response.text).toBe(`Hola, La frase ingresada es palindromo`);
            });
    });


    test("test de endpoint /palindromo/:frase", async () => {
        const frase = 'hola';  
        return await request(app)
            .get(`/palindromo/${frase}`)
            .expect("Content-Type", /text/)
            .expect(200)
            .then((response) => {
                expect(response.text).toBe(`Hola, La frase ingresada no es palindromo`);
            });
    });

    test("test de endpoint /primo/:numero", async () => {
        const numeroPrimo = 7;        
        return await request(app)
            .get(`/primo/${numeroPrimo}`)
            .expect("Content-Type", /text/)
            .expect(200)
            .then((response) => {
                expect(response.text).toBe(`Hola, el numero ingresado es un numero primo`);
            });        
         
    });

    test("test de endpoint /primo/:numero con un número no primo", async () => {
        const numeroNoPrimo = 4; 
        
        return await request(app)
            .get(`/primo/${numeroNoPrimo}`)
            .expect("Content-Type", /text/)
            .expect(200)
            .then((response) => {
                expect(response.text).toBe(`Hola, el numero ingresado no es un numero primo`);
            });
    });

    test("test de endpoint /primo/:numero con un número no primo", async () => {
        const numeroNoPrimo = 1;  
        
        return await request(app)
            .get(`/primo/${numeroNoPrimo}`)
            .expect("Content-Type", /text/)
            .expect(200)
            .then((response) => {
                expect(response.text).toBe(`Hola, el numero ingresado no es un numero primo`);
            });
    });
});