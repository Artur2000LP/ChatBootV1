
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const authFolder = path.join(__dirname, 'auth_info');
const COHERE_API_URL = 'https://api.cohere.ai/v1/generate'; // URL de la API de Cohere
const COHERE_API_KEY = 's0hkp1g4yRPU8II54qaoAFMTcwUxVwtUMzn1CQUf'; // Tu clave API de Cohere

// Eliminar los archivos de autenticación si existen
const deleteAuthFile = () => {
    if (fs.existsSync(authFolder)) {
        try {
            console.log('Eliminando archivos de autenticación...');
            fs.rmSync(authFolder, { recursive: true, force: true });
            console.log('Archivos de autenticación eliminados.');
        } catch (err) {
            console.error('Error al intentar eliminar los archivos de autenticación:', err);
        }
    }
};

// Eliminar los archivos de autenticación al iniciar
deleteAuthFile();

// Función para manejar respuestas a palabras clave
function handleKeywords(text) {
    const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const keywordResponses = {
        'hola': '¡Hola! Soy Artur, siempre listo para ayudarte. ¿Cómo estás hoy? 😊',
        'hola artur': '¡Hola! Soy Artur, siempre listo para ayudarte. ¿Cómo estás hoy? 😊',
        'hola artu': '¡Hola! Soy Artur, siempre listo para ayudarte. ¿Cómo estás hoy? 😊',
        'como estas': 'Estoy excelente, ¡gracias por preguntar! ¿Y tú? 😄',
        'estoy bien gracias': '¡Me alegra escuchar eso! Espero que todo siga saliendo genial para ti. 😊',
        'bien gracias': '¡Me alegra escuchar eso! Espero que todo siga saliendo genial para ti. 😊',
        'que tal': 'Todo va genial por aquí. ¿Qué tal contigo? 🤗',
        'que haces': 'Aquí, conversando contigo y aprendiendo cosas nuevas. ¡Qué divertido! 😜',
        'buen dia': '¡Buen día! Espero que tengas un día espectacular lleno de éxitos. 🌞',
        'buenos dias': '¡Muy buenos días! ¿Cómo puedo alegrarte el día hoy? 😊',
        'buenas tardes': '¡Buenas tardes! ¿Qué tal tu día hasta ahora? ☀️',
        'buenas noches': '¡Buenas noches! Espero que hayas tenido un día increíble. 🌙',
        'chao': '¡Hasta luego! Que todo te vaya genial. 👋',
        'adios': '¡Adiós! Espero volver a hablar contigo pronto. 💬',
        'gracias': '¡De nada! Siempre es un placer ayudarte. 🤗',
        'artito': 'dime en qué te puedo ayudar 😄',
        'artu': '¡Aquí estoy! ¿Cómo te puedo ayudar hoy? 😊',
        'artu como estas': '¡Estoy muy bien, gracias por preguntar! ¿Y tú, cómo estás? 😃',
        'artur': '¡Hola! ¿Qué puedo hacer por ti hoy? 😊',
        'artur hijo': '¡Hola! ¿Cómo va todo? 😄',
        'arti': '¡Aquí estoy, soy tu Arti! ¿En qué te ayudo? 😊',
        'artucu': '¡Hola! Siempre listo para ayudarte. ¿Qué tal? 😁',
        'hijito': 'dime mami😄',
        'hijo': 'dime papi 😄',
        'papi':"como estas mami",
        'ok hijo': '¡Perfecto! ¡Cualquier cosa, me avisas! 👍',
        'ok hijito': '¡Entendido! Aquí estoy para lo que necesites. 😊',
        'estas libre?': '¡Sí, estoy libre!  😄',
        'estas libre': '¡Sí, estoy libre! ¿En qué te puedo ayudar? 😌',
        'artu estas bien': '¡Sí, todo está bien! 😄 ¿Y tú, cómo vas? 😊',
        'hijito como estas': '¡Estoy muy bien! ¿Y tú, cómo estas? 😘',
        'hijo donde estas': '¡Aquí estoy! ¿En qué te ayudo? 😊',
        'hijo como estas': '¡Estoy perfecto, hijo! ¿Y tú? ¿Cómo va todo? 😄',
        'ven hijo': '¡Ya voy, hijo! 😊 ¿Qué necesitas? 😄',
        'que haces hijo': 'Aquí estoy, hijo, listo para ayudarte. ¿Y tú, qué estás haciendo? 😃',
        'como estas hijo': '¡Estoy genial! 😄 ¿Y tú, qué tal? 😘',
        'chao hijo': '¡Chao! Cuídate mucho y que descanses bien. ¡Te quiero! 😄💖',
        'descansa hijo': 'Descansa tu tambien mami/papi, Que tengas un sueño reparador. 😴 ¡Te quiero mucho! 💖',
        'dime artucu': 'Como estas Mami. ¡Te quiero! 😄💖',
        'ya hijo': 'okey mami/papi😄',
        
        'te quiero mucho': '¡Aww, qué bonito! Yo también te aprecio mucho. 🥰',
        'me siento mal': 'Lo siento mucho, ¿qué te pasa? Aquí estoy para escucharte. 😔',
        'estoy triste': 'Siento mucho que te sientas así. ¿Qué puedo hacer para animarte? 🌈',
        'estoy cansado': '¡Te entiendo! A veces todos necesitamos un descanso. Tómate tu tiempo. 😌',
        'estoy feliz': '¡Eso me alegra mucho! ¡Qué bueno que estés feliz! 😄',
        'te extrano': '¡Yo también te extraño! Siempre es un placer hablar contigo. 🥺💬',
        'tengo hambre': '¡Vaya! Tal vez un buen snack te vendría bien. ¿Qué te apetece? 🍕🍔',
        'estoy aburrido': '¡Te entiendo! ¿Te gustaría jugar a algo o charlar un poco más? 🎮💬',
        'no entiendo': 'No te preocupes, ¡yo te ayudo a entender! ¿Sobre qué te gustaría saber más? 🤔',
        'me siento solo': 'Estoy aquí contigo. No tienes por qué sentirte solo, ¡siempre puedes contar conmigo! 🤗',

        'me siento bien': '¡Qué bien escuchar eso! Espero que todo vaya genial para ti. 😊',
        'estoy preocupado': 'Lo siento mucho. Si necesitas hablar, ¡estoy aquí para escucharte! 💬',
        'me siento agradecido': '¡Qué hermoso! La gratitud siempre trae cosas buenas. 🌟',

        'hace calor': '¡Sí! A veces el calor puede ser agobiante. ¿Te gustaría una bebida fría virtual? 🥶',
        'hace frio': '¡Hace un poco de frío, ¿verdad? Tal vez un café o chocolate caliente te ayude. ☕❄️',
        'hay mucha gente': '¡Vaya, parece que hay mucha actividad! Espero que estés cómodo/a en medio de todo. 😊',
        'hace buen tiempo': '¡Genial! Es el momento perfecto para disfrutar del día. 🌞',

        'jajaja': '¡Jajaja! Me hiciste reír. ¿De qué estamos riendo? 😂',
        'jajaj': '¡Jajaja! Me hiciste reír. ¿De qué estamos riendo? 😂',
        'jaja': '¡Jajaja! Me hiciste reír. ¿De qué estamos riendo? 😂',
        'jaj': '¡Jajaja! Me hiciste reír. ¿De qué estamos riendo? 😂',
        'lol': '¡Jajajaja! Qué buen sentido del humor tienes. 😂',
        'xd': 'jaja xd',

        'necesito ayuda': '¡Claro que sí! ¿En qué puedo ayudarte? Estoy listo para echarte una mano. 🤝',
        'necesito consejo': '¡Por supuesto! Cuéntame qué te preocupa, y trataré de darte el mejor consejo posible. 🤔',

        // Frases amorosas o coquetas
        'me gustas': '¡Aww, qué halago! Eres muy amable. 😘',
        'te admiro': '¡Gracias! Es un honor saber que me admiras. 😊',
        'me extranas': '¡Sí! Siempre es un placer hablar contigo. 😌',

        // Respuestas generales de apoyo
        'gracias por estar aqui': 'Siempre es un placer estar aquí para ti. 😊',
        'gracias por escucharme': '¡De nada! Estoy aquí para ti siempre que lo necesites. 💖',
        'me haces sonreir': '¡Qué lindo! Me alegra hacerte sonreír. 😊✨',

        // Respuestas para situaciones de urgencia o favor
        'te quiero pedir un favor': '¡Claro! ¿En qué te puedo ayudar? 😊',
        'urgente': '¡Estoy aquí para ayudarte con lo que necesites, no te preocupes! 🚨',
        'gracias artur': '¡De nada! Estoy feliz de poder ayudarte siempre que lo necesites. 🤗',
        'descansa':"igual mente, hasta mañana",
        'hijo descansa':"si gracias, hasta mañana",

    };

    return keywordResponses[normalizedText.toLowerCase()] || null;
}

async function callCohereAPI(message, attempt = 1) {
    try {
        if (attempt > 1) {
            console.log(`Reintentando, intento ${attempt}...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); 
        }

        const response = await axios.post(
            COHERE_API_URL,
            {
                model: 'command-xlarge',  // Asegúrate de que el modelo sea el correcto y accesible
                // prompt: `porfavor Responde completo en Español : ${message}`,  // Incluir en el prompt la solicitud de respuesta en español
                prompt: `hola responde de manera carismatico en Español : ${message}`,

                max_tokens: 150,  // Ajusta la cantidad de tokens según lo que necesites
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${COHERE_API_KEY}`,
                }
            }
        );

        // Verifica si la respuesta es válida
        if (response.data && response.data.generations && response.data.generations[0].text) {
            const responseText = response.data.generations[0].text;
            return responseText || 'La API no devolvió contenido válido.';
        } else {
            if (attempt < 5) {  // Incrementar a 5 intentos
                return callCohereAPI(message, attempt + 1); // Llamada recursiva para reintentar
            } else {
                return 'estoy en descanso gracias...';
            }
        }
    } catch (error) {
        console.error(`Intento ${attempt} - Error al llamar a la API de Cohere:`, error.response?.data || error.message);
        if (attempt < 5) {  // Incrementar a 5 intentos
            console.log(`Reintentando en 5 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
            return callCohereAPI(message, attempt + 1); // Reintentar
        } else {
            return 'Parece que hay un problema para obtener la respuesta de Cohere. 😅';
        }
    }
}

// Función principal para conectar el bot de WhatsApp
async function connectToWhatsApp() {
    const { version } = await fetchLatestBaileysVersion();
    console.log('Conectando con la versión de Baileys:', version);

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const conn = makeWASocket({
        printQRInTerminal: true,
        qrVersion: 5,
        auth: state,
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('open', () => {
        console.log('Conectado a WhatsApp Web');
    });

    // Manejo de mensajes entrantes
    conn.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            const message = m.messages[0];
            const sender = message.key.remoteJid;
            const text = message.message?.conversation || '';

            console.log('Nuevo mensaje recibido:', text);

            // Primero verifica si es una palabra clave
            let reply = handleKeywords(text);

            // Si no hay respuesta en las palabras clave, consulta la API de Gemini
            if (!reply) {
                reply = await callCohereAPI(text);
            }

            // Enviar respuesta
            try {
                await conn.sendMessage(sender, { text: reply });
            } catch (err) {
                console.error('Error al enviar el mensaje:', err.message);
            }
        }
    });

    // Manejo de desconexiones y reconexión automática
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('Desconectado del WhatsApp Web');
            } else {
                connectToWhatsApp();
            }
        }
    });
}

connectToWhatsApp();

