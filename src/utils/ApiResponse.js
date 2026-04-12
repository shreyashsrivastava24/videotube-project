//req res k liye hum core node js use nhi kr rhe iske liye hm express framework use kr rhe aur express as such classes like error class nhi deta so khud ki class bna rhe

class ApiResponse {

    // Jab hum "new ApiResponse(...)" likhenge to ye constructor chalega
    constructor(
        statusCode,                // HTTP status code (200, 201, etc.)
        data,                      // jo actual data hum bhejna chahte hain
        message = "Success"        // default message
    ) {

        this.statusCode = statusCode;
        // response ka status code store kar rahe hain

        this.data = data;
        // actual data jo frontend ko bhejna hai

        this.message = message;
        // success message

        this.success = statusCode < 400;
        // agar statusCode 400 se kam hai → success true
        // warna false (error case)
    }
}

// export taaki dusri files me use kar sake
export { ApiResponse };