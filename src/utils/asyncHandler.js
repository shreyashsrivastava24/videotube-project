// Async Handler: async route functions ke liye wrapper
// → kyun? kyunki Express async errors ko khud catch nahi karta

// M1 using promises

const asyncHandler = (requestHandler) => {

    // requestHandler kya hai?
    // → tumhara original route function
    // → example: async (req, res) => { ... }

    // return kyu?
    // → Express ko (req, res, next) wala function chahiye
    // → isliye hum yaha ek naya function bana ke return kar rahe hain

    return (req, res, next) => {

        // requestHandler async hai → wo automatically Promise return karega

        Promise
            // Promise.resolve:
            // → agar function Promise return kare → same rahega
            // → agar normal ho → usko Promise me convert kar dega
            .resolve(requestHandler(req, res, next))

            // agar error aaya (Promise reject hua)
            // → yaha catch usse pakdega
            .catch((err) => {
                next(err); // error Express ke error handler ko de diya
            });
    };
};

export { asyncHandler };


// ---------------------------------------------

// M2 using try-catch (alternative)

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         // fn = tumhara async route function
//         await fn(req, res, next); // run ho raha hai
//     } catch (error) {
//         // error aaya to yaha manually handle kar rahe hain
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };