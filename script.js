/*
=========================
Rwanda AI Platform Main 
Script
=========================
*/

import { db } from "./firebase.js";

import {collection,addDoc,getDocs} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";


console.log("Rwanda AI Platform started");


let providers = [];

/*
=========================
LOAD PROVIDERS 
=========================
*/

async function 
loadProviders(){
  
  try{
    
    const snapshot = await getDocs(
      
      collection(db,"providers"
      )
      
         );
         
         providers = [];
         
         
         
         snapshot.forEach(function(doc){
           
           providers.push(doc.data()
           );
           
               });
               
               console.log("providers loaded:", providers);
               
  }catch(error){
    
    console.log("provider loading error:", error);
    
  }
  
}

loadProviders();


/*
=========================
SERVICE SEARCH
=========================
*/

const searchBtn = document.getElementById("searchBtn");

if(searchBtn){
  
  searchBtn.addEventListener("click",function(){
    
    const searchValue = document.getElementById("searchInput").value.toLowerCase().trim();
    
    
    const result = providers.filter(function(item){
      
      return (
        
        (item.service && item.service.toLowerCase().includes(searchValue))
       
       
       ||
       
       (item.category && item.category.toLowerCase().includes(searchValue))
       
       
       ||
       
       (item.location && item.location.toLowerCase().includes(searchValue))
       
       );
       
    });
    
    
    const resultBox = document.getElementById("result");
    
    
    if(result.length > 0){
      
      resultBox.innerHTML = result.map(function(item){
        
        
        return `
        
        <div class="card">
        
        <h3>${item.name}</h3>
        
        <p>Service: ${item.service}</p>
        
        <p>price: ${item.price}</p>
        <p>Category: ${item.category}</p>
        
        <p>Location: ${item.location}</p>
        
        <p>Phone: ${item.phone}</p>
        
        </div>
        
        `;
        
      }).join("");
      
      
    }else{
      
      resultBox.innerHTML = "No provider found";
      
    }
    
    
  });
  
}

/*
=========================
REGISTER PROVIDER 
=========================
*/


const registerBtn = document.getElementById("registerBtn");


if(registerBtn){
  
  registerBtn.addEventListener("click", async function(){
    
    
    const name = document.getElementById("name").value.trim();
    
    const service = document.getElementById("service").value.trim();
    
    const price = document.getElementById("price").value.trim();
    
    const category = document.getElementById("category").value.trim();
    
    const location = document.getElementById("location").value.trim();
    
    const phone = document.getElementById("phone").value.trim();
    
    const message = document.getElementById("message");
    
    
    
    if(
    !name ||
    !service ||
    !price ||
    !category ||
    !location ||
    !phone){
      
    
    message.innerHTML = "Please fill all field";
    
    
    return;
    
    }
    
    
    
    try{
      
      await addDoc(
        collection(db,"providers"),
        {
          
          name:name,
          
          service:service,
          
          price:price,
          
          category:category,
          
          location:location,
          
          phone:phone,
          
          createdAt:new Date()
          
        }
        
        );
        
        
        message.innerHTML ="Registration Successfully";
        
        
        document.getElementById("name").value="";
        
        document.getElementById("service").value="";
        
        document.getElementById("price").value="";
        
        document.getElementById("category").value="";
        
        document.getElementById("location").value="";
        
        document.getElementById("phone").value="";
        
        
        await loadProviders();
        
        
    }catch(error){
      
      
      console.log("Registration error:",error);
      
      message.innerHTML = error.message;
      
    }
    
    
  });
  
}

/*
=========================
RWANDA AI KNOWLEDGE BASE 
=========================
*/


const askBtn = document.getElementById("askBtn");

if(askBtn){
  
  askBtn.addEventListener("click",async function(){
    
    
    
    const question = document.getElementById("question").value.toLowerCase().trim();
    
    
    const answerBox = document.getElementById("answer");
    
    
    if(!question){
      
      answerBox.innerHTML ="<p>Please ask a question</p>";
      
      
      return;
      
    }
    
    
    let answer = "nta makuru mfite kuri icyo kibazo ubu.";
    
    
    try{
      
      
      const snapshot = await getDocs(collection(db,"knowledge")
      );
      
      
      snapshot.forEach(function(doc){
        
        const data = doc.data();
        
        
        const savedQuestion = data.question? data.question.toLowerCase().trim():"";
        
        
        if(savedQuestion &&(question.includes(savedQuestion) 
          || 
          savedQuestion.includes(question)
          )
          
          ){
            
          answer = data.answer;
          
          }
          
      });
      
      
      answerBox.innerHTML ="<p>"+answer+"</p>";
      
      
    }catch(error){
      
      console.log("AI error:",error);
      
      answerBox.innerHTML = "<p>Habaye ikibazo icyibazo cyo gushaka igisubizo.</p>";
      
    }
    
    
  });
  
}
    
            
            
            
            
          
        
        
        
      
      
      
    
      
    
   
    
    
    
    
    
    
    
   
    
  
  
  



      
      
    
        
        
       
        
        
        
        
        
     
        
        
        
     
        
    
    
    
    
    
    
    
    
    
    
    
      
      
    
   
   
    
    
    
    
  

      
      
    
        
        
        
      
      
      
    
       
       
    
  
  
  


  
              
         
         
         
        
  




