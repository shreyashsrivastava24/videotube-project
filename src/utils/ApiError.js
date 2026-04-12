// Ye ek custom error class hai (apna banaya hua error system), taki hum error ko standardise kr de agr error aaye to iss formate me aaye
//node js error class deta hai
class ApiError extends Error {

    // Jab bhi hum "new ApiError(...)" likhenge, ye constructor chalega
    constructor(
        statusCode,                         // HTTP status code (404, 500, etc.)
        message = "Something went wrong",   // error ka message
        errors = [],                        // extra error details (optional)
        stack = ""                          // error kaha hua (optional info)
    ) {

        super(message);
        // 🔴 super kya hai?
        // JavaScript me ek built-in Error class hoti hai
        // usme already "message" handle karne ka system hota hai
        // super(message) = us built-in Error ko bol rahe:
        // "ye wala message use karo"
        // agar ye na likhe → error ka message properly kaam nahi karega

        this.statusCode = statusCode;
        // yaha hum status code store kar rahe hain (jaise 404)

        this.data = null;
        // error case me data nahi hota, isliye null

        this.message = message;
        // error ka message store

        this.success = false;
        // batata hai ki request fail ho gayi

        this.errors = errors;
        // agar multiple errors hain (validation etc.), wo yaha store honge

        if (stack) {
            this.stack = stack;
            // stack kya hai?
            // stack = "error kaha hua" ki detail
            // jaise: kaunsi file, kaunsi line, kaunsa function
            // agar koi manually de raha hai to wo use kar lo
        } else {
            Error.captureStackTrace(this, this.constructor);
            // ye kya kar raha hai?
            // ye automatically find karta hai:
            // "error exactly kaha se aaya?"
            // (file name + line number + function call chain)
            // debugging me help karta hai (bug dhundhne ke liye)
        }
    }
}

// export taaki dusri files me use kar sake
export { ApiError };