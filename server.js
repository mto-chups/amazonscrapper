const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');  // Ajout du module CORS

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour autoriser toutes les origines
app.use(cors());

app.get('/amazon-price', async (req, res) => {
    const productQuery = req.query.query;  // Le nom du produit envoyé par l'extension
    console.log("Requête reçue pour le produit:", productQuery);  // Log de la requête reçue

    if (!productQuery) {
        console.log("Erreur: Paramètre de requête manquant");
        return res.status(400).json({ error: 'Query parameter is missing' });
    }

    try {
        const price = await scrapeAmazonPrice(productQuery);
        if (price) {
            console.log("Prix trouvé pour le produit:", price);  // Log du prix trouvé
            res.json({ price });
        } else {
            console.log("Aucun produit trouvé pour la requête:", productQuery);
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error("Erreur lors du scraping:", error);  // Log en cas d'erreur
        res.status(500).json({ error: 'An error occurred during scraping' });
    }
});

// Fonction pour lancer Puppeteer et scraper la page Amazon
async function scrapeAmazonPrice(productName) {
    console.log("Lancement de Puppeteer pour le produit:", productName);  // Log avant le scraping
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const searchUrl = `https://www.amazon.fr/s?k=${encodeURIComponent(productName)}`;
    console.log("URL de recherche Amazon:", searchUrl);  // Log de l'URL de recherche
    await page.goto(searchUrl);

    try {
        await page.waitForSelector('.s-main-slot .s-result-item', { timeout: 5000 });

        const price = await page.evaluate(() => {
            const priceWhole = document.querySelector('.a-price-whole')?.innerText;
            const priceFraction = document.querySelector('.a-price-fraction')?.innerText;
            return priceWhole && priceFraction ? `${priceWhole},${priceFraction}` : null;
        });

        await browser.close();
        console.log("Prix récupéré par Puppeteer:", price);  // Log du prix récupéré
        return price;
    } catch (error) {
        console.error("Erreur lors de l'extraction du prix avec Puppeteer:", error);  // Log en cas d'erreur
        await browser.close();
        return null;
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
