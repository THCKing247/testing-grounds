// Chatbot helper functions - make available immediately
// These will be redefined in the chatbot block below, but this ensures they're available early
window.testChatbotAI = window.testChatbotAI || function() {
  console.warn('⚠️ Chatbot functions not loaded yet. Please refresh the page (Ctrl+F5 for hard refresh).');
  return Promise.resolve(false);
};
window.checkChatbotAI = window.checkChatbotAI || function() {
  console.warn('⚠️ Chatbot functions not loaded yet. Please refresh the page (Ctrl+F5 for hard refresh).');
  return { enabled: false, error: 'Functions not loaded' };
};

// Set active nav link
const currentPath = window.location.pathname;
const navLinks = document.querySelectorAll(".nav a");
navLinks.forEach(link=>{
  const linkPath = new URL(link.href).pathname;
  if(linkPath === currentPath || (currentPath === "/" && linkPath === "/") || (currentPath.endsWith("/") && linkPath === currentPath.slice(0, -1))){
    link.classList.add("active");
  }
});

// FAQ Accordion
document.querySelectorAll(".faq-item").forEach(item=>{
  const question = item.querySelector(".faq-question");
  if(question){
    question.addEventListener("click",()=>{
      const isActive = item.classList.contains("active");
      document.querySelectorAll(".faq-item").forEach(i=>i.classList.remove("active"));
      if(!isActive) item.classList.add("active");
    });
  }
});

// Handle blog images - show fallback text when images fail to load
document.querySelectorAll(".blog-card-image img, .blog-post-image img").forEach(img=>{
  img.addEventListener("error", function(){
    this.style.display = "none";
    this.classList.add("error");
    const container = this.parentElement;
    if(container){
      container.classList.add("image-missing");
    }
  });
  
  // Check if image loaded successfully
  if(img.complete && img.naturalHeight === 0){
    img.dispatchEvent(new Event("error"));
  }
});

// Scroll reveal
const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting) e.target.classList.add("in");
  });
},{threshold:.15});
reveals.forEach(r=>io.observe(r));

// Header shrink - disabled to prevent glitching
// const header = document.querySelector(".site-header");
// if(header){
//   window.addEventListener("scroll",()=>{
//     if(window.scrollY > 30) header.classList.add("is-shrunk");
//     else header.classList.remove("is-shrunk");
//   },{passive:true});
// }

// Mobile menu
const nav = document.querySelector(".nav");
const mobileToggle = document.querySelector(".mobile-menu-toggle");
if(nav && mobileToggle){
  mobileToggle.addEventListener("click",()=>{
    nav.classList.toggle("is-open");
    const isOpen = nav.classList.contains("is-open");
    mobileToggle.setAttribute("aria-expanded", isOpen);
    mobileToggle.innerHTML = isOpen ? "✕" : "☰";
  });
  
  // Close menu when clicking outside
  document.addEventListener("click",(e)=>{
    if(!nav.contains(e.target) && !mobileToggle.contains(e.target)){
      nav.classList.remove("is-open");
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileToggle.innerHTML = "☰";
    }
  });
  
  // Close menu on escape key
  document.addEventListener("keydown",(e)=>{
    if(e.key === "Escape" && nav.classList.contains("is-open")){
      nav.classList.remove("is-open");
      mobileToggle.setAttribute("aria-expanded", "false");
      mobileToggle.innerHTML = "☰";
      mobileToggle.focus();
    }
  });
  
  // Close menu when clicking nav links on mobile
  nav.querySelectorAll("a").forEach(link=>{
    link.addEventListener("click",()=>{
      if(window.innerWidth <= 768){
        nav.classList.remove("is-open");
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileToggle.innerHTML = "☰";
      }
    });
  });
}

// Particles
const canvas = document.getElementById("particles");
if(canvas){
  const ctx = canvas.getContext("2d");
  let w,h;
  function resize(){
    w=canvas.width=window.innerWidth;
    h=canvas.height=window.innerHeight;
  }
  resize();
  window.addEventListener("resize",resize);

  const dots=[...Array(70)].map(()=>({
    x:Math.random()*w,
    y:Math.random()*h,
    r:Math.random()*2+1,
    vx:(Math.random()-.5)*.4,
    vy:(Math.random()-.5)*.4
  }));

  function draw(){
    ctx.clearRect(0,0,w,h);
    dots.forEach(d=>{
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>w) d.vx*=-1;
      if(d.y<0||d.y>h) d.vy*=-1;
      ctx.beginPath();
      ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle="rgba(255,255,255,.35)";
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// Contact form validation and submission
const contactForm = document.getElementById("contactForm");
if(contactForm){
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn?.querySelector(".btn-text");
  const btnLoader = submitBtn?.querySelector(".btn-loader");
  const formStatus = document.getElementById("form-status");
  const captchaCheckbox = document.getElementById("captcha");
  const charCount = document.getElementById("charCount");
  const messageField = document.getElementById("message");
  
  // Rate limiting - prevent double submissions
  let lastSubmissionTime = 0;
  const MIN_SUBMISSION_INTERVAL = 5000; // 5 seconds
  
  // Character counter
  if(messageField && charCount){
    messageField.addEventListener("input", ()=>{
      const length = messageField.value.length;
      charCount.textContent = length;
      if(length > 2000){
        messageField.value = messageField.value.substring(0, 2000);
        charCount.textContent = "2000";
      }
      charCount.style.color = length > 1800 ? "#ef4444" : "var(--muted)";
    });
  }
  
  function showError(fieldId, message){
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if(field && errorEl){
      field.setAttribute("aria-invalid", "true");
      field.classList.add("error");
      errorEl.textContent = message;
    }
  }
  
  function clearError(fieldId){
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if(field && errorEl){
      field.removeAttribute("aria-invalid");
      field.classList.remove("error");
      errorEl.textContent = "";
    }
  }
  
  function clearAllErrors(){
    ["name","email","phone","jobTitle","companyName","companyWebsite","topic","message","captcha"].forEach(clearError);
    if(formStatus) formStatus.textContent = "";
    if(formStatus) formStatus.className = "form-status";
  }
  
  // Clear captcha error when checked
  if(captchaCheckbox){
    captchaCheckbox.addEventListener("change", ()=>{
      if(captchaCheckbox.checked){
        clearError("captcha");
      }
    });
  }
  
  function setLoading(loading){
    if(!submitBtn) return;
    submitBtn.disabled = loading;
    if(btnText) btnText.style.display = loading ? "none" : "inline";
    if(btnLoader) btnLoader.style.display = loading ? "inline" : "none";
  }
  
  function showStatus(message, isError = false){
    if(!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status ${isError ? "error" : "success"}`;
    formStatus.setAttribute("role", "alert");
  }
  
  // Real-time validation
  ["name","email","phone","jobTitle","companyName","companyWebsite","topic","message","captcha"].forEach(id=>{
    const field = document.getElementById(id);
    if(field){
      field.addEventListener("blur", ()=>{
        if(field.value.trim() && field.id !== "captcha"){
          clearError(id);
        }
      });
      field.addEventListener("input", ()=>{
        if(field.id === "phone"){
          // Basic phone validation
          const phoneValue = field.value.replace(/\D/g, '');
          if(phoneValue.length > 0 && phoneValue.length < 10){
            // Invalid but don't show error until blur
          } else {
            clearError(id);
          }
        } else if(field.id === "companyWebsite" && field.value){
          // Basic URL validation
          try {
            new URL(field.value.startsWith('http') ? field.value : `https://${field.value}`);
            clearError(id);
          } catch {
            // Invalid URL, but don't show error until blur
          }
        } else if(field.validity.valid && field.id !== "captcha"){
          clearError(id);
        }
      });
    }
  });
  
  contactForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    clearAllErrors();
    
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastSubmission = now - lastSubmissionTime;
    if(timeSinceLastSubmission < MIN_SUBMISSION_INTERVAL){
      const remainingTime = Math.ceil((MIN_SUBMISSION_INTERVAL - timeSinceLastSubmission) / 1000);
      showStatus(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before submitting again.`, true);
      return;
    }
    
    const formData = new FormData(contactForm);
    let isValid = true;
    
    // Validate name
    const name = formData.get("name")?.trim();
    if(!name){
      showError("name", "Please enter your name");
      isValid = false;
    }
    
    // Validate email
    const email = formData.get("email")?.trim();
    const emailField = document.getElementById("email");
    if(!email){
      showError("email", "Please enter your email address");
      isValid = false;
    } else if(emailField && !emailField.validity.valid){
      showError("email", "Please enter a valid email address");
      isValid = false;
    }
    
    // Validate phone (optional but if provided, should be valid)
    const phone = formData.get("phone")?.trim();
    if(phone){
      const phoneDigits = phone.replace(/\D/g, '');
      if(phoneDigits.length > 0 && phoneDigits.length < 10){
        showError("phone", "Please enter a valid phone number");
        isValid = false;
      }
    }
    
    // Validate company website (optional but if provided, should be valid)
    const companyWebsite = formData.get("companyWebsite")?.trim();
    if(companyWebsite){
      try {
        const url = companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`;
        new URL(url);
      } catch {
        showError("companyWebsite", "Please enter a valid website URL");
        isValid = false;
      }
    }
    
    // Validate topic
    const topic = formData.get("topic");
    if(!topic){
      showError("topic", "Please select a topic");
      isValid = false;
    }
    
    // Validate message
    const message = formData.get("message")?.trim();
    if(!message){
      showError("message", "Please enter a message");
      isValid = false;
    } else if(message.length < 10){
      showError("message", "Please provide more details (at least 10 characters)");
      isValid = false;
    } else if(message.length > 2000){
      showError("message", "Message must be 2000 characters or less");
      isValid = false;
    }
    
    // Validate CAPTCHA checkbox
    if(!captchaCheckbox || !captchaCheckbox.checked){
      showError("captcha", "Please confirm you are not a robot by checking the box");
      isValid = false;
    }
    
    if(!isValid){
      const firstError = contactForm.querySelector(".error, [aria-invalid='true']");
      if(firstError){
        firstError.focus();
        firstError.scrollIntoView({behavior: "smooth", block: "center"});
      }
      return;
    }
    
    // Update last submission time
    lastSubmissionTime = now;
    
    setLoading(true);
    showStatus("Sending your message...", false);
    
    try{
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });
      
      if(response.ok){
        showStatus("Message sent successfully! Redirecting...", false);
        // Store submission time in sessionStorage
        sessionStorage.setItem("lastFormSubmission", now.toString());
        setTimeout(()=>{
          window.location.href = "/contact/thanks/";
        }, 1000);
      } else {
        const data = await response.json();
        if(data.errors){
          const firstError = data.errors[0];
          showStatus(firstError.message || "There was an error sending your message. Please try again.", true);
        } else {
          showStatus("There was an error sending your message. Please try again or email us directly.", true);
        }
        setLoading(false);
        // Reset CAPTCHA checkbox
        if(captchaCheckbox) captchaCheckbox.checked = false;
      }
    } catch(error){
      showStatus("Network error. Please check your connection and try again, or email us directly.", true);
      setLoading(false);
      // Reset CAPTCHA checkbox
      if(captchaCheckbox) captchaCheckbox.checked = false;
    }
  });
  
  // Check sessionStorage on load for additional rate limiting
  const storedTime = sessionStorage.getItem("lastFormSubmission");
  if(storedTime){
    const stored = parseInt(storedTime);
    const timeSince = Date.now() - stored;
    if(timeSince < MIN_SUBMISSION_INTERVAL){
      const remaining = Math.ceil((MIN_SUBMISSION_INTERVAL - timeSince) / 1000);
      if(submitBtn && btnText){
        submitBtn.disabled = true;
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="btn-text">Please wait ${remaining}s</span>`;
        setTimeout(()=>{
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }, MIN_SUBMISSION_INTERVAL - timeSince);
      }
    }
  }
}

// Back to Top Button
const backToTopBtn = document.createElement("button");
backToTopBtn.className = "back-to-top";
backToTopBtn.innerHTML = "↑";
backToTopBtn.setAttribute("aria-label", "Back to top");
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.body.appendChild(backToTopBtn);

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add("visible");
  } else {
    backToTopBtn.classList.remove("visible");
  }
}, { passive: true });

// Search Functionality
const searchBox = document.querySelector(".search-box");
if (searchBox) {
  const searchResults = document.querySelector(".search-results");
  const pages = [
    { title: "Home", url: "/", content: "Web development, automation, custom apps" },
    { title: "Services", url: "/services/", content: "Custom web applications, automation, websites, consulting" },
    { title: "About", url: "/about/", content: "About Apex Technical Solutions Group" },
    { title: "Contact", url: "/contact/", content: "Get in touch, request a quote" },
    { title: "FAQ", url: "/faq/", content: "Frequently asked questions" },
    { title: "Pricing", url: "/pricing/", content: "Project pricing and rates" },
    { title: "Process", url: "/process/", content: "How we work, development process" },
    { title: "Blog", url: "/blog/", content: "Technology trends, web development, automation" },
    { title: "Technology Trends", url: "/blog/technology-trends/", content: "Latest technology trends in web development" },
    { title: "Business Automation", url: "/blog/business-automation/", content: "Business automation strategies and implementation" },
    { title: "Customer Experience Automation", url: "/blog/customer-experience-automation/", content: "Automating customer experience touchpoints" },
    { title: "Modern Web Development", url: "/blog/modern-web-development/", content: "Modern web development practices and architecture" },
    { title: "Web Performance", url: "/blog/web-performance/", content: "Web performance optimization strategies" },
    { title: "Documentation Best Practices", url: "/blog/documentation-best-practices/", content: "Technical documentation best practices" }
  ];

  searchBox.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!searchResults) return;

    if (query.length < 2) {
      searchResults.innerHTML = "";
      return;
    }

    const results = pages.filter(page => 
      page.title.toLowerCase().includes(query) || 
      page.content.toLowerCase().includes(query)
    );

    if (results.length === 0) {
      searchResults.innerHTML = `<div class="search-result-item"><p>No results found for "${query}"</p></div>`;
      return;
    }

    searchResults.innerHTML = results.map(page => {
      const highlightedTitle = page.title.replace(
        new RegExp(`(${query})`, "gi"),
        '<span class="search-highlight">$1</span>'
      );
      return `
        <div class="search-result-item">
          <h3><a href="${page.url}">${highlightedTitle}</a></h3>
          <p>${page.content}</p>
        </div>
      `;
    }).join("");
  });
}

// Newsletter Form
const newsletterForm = document.querySelector(".newsletter-form");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector("input[type='email']");
    const email = emailInput.value;
    const submitBtn = newsletterForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.textContent : "";
    
    // Disable button and show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Subscribing...";
    }
    
    try {
      const response = await fetch("https://formspree.io/f/mgowqqrj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: email,
          _subject: "Newsletter Subscription",
          _replyto: email
        })
      });
      
      if (response.ok) {
        alert("Thank you for subscribing! We'll be in touch soon.");
        newsletterForm.reset();
      } else {
        const data = await response.json();
        if (data.errors) {
          alert("Please enter a valid email address.");
        } else {
          alert("Something went wrong. Please try again later.");
        }
      }
    } catch (error) {
      alert("Something went wrong. Please try again later.");
    } finally {
      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}

// Cookie Consent
function showCookieConsent() {
  const consent = localStorage.getItem("cookieConsent");
  if (!consent) {
    const cookieBanner = document.querySelector(".cookie-consent");
    if (cookieBanner) {
      setTimeout(() => cookieBanner.classList.add("show"), 1000);
    }
  }
}

function acceptCookies() {
  localStorage.setItem("cookieConsent", "accepted");
  const cookieBanner = document.querySelector(".cookie-consent");
  if (cookieBanner) {
    cookieBanner.classList.remove("show");
  }
}

function declineCookies() {
  localStorage.setItem("cookieConsent", "declined");
  const cookieBanner = document.querySelector(".cookie-consent");
  if (cookieBanner) {
    cookieBanner.classList.remove("show");
  }
}

// Initialize cookie consent
document.addEventListener("DOMContentLoaded", () => {
  showCookieConsent();
  
  const acceptBtn = document.querySelector(".cookie-consent-btn.accept");
  const declineBtn = document.querySelector(".cookie-consent-btn.decline");
  if (acceptBtn) acceptBtn.addEventListener("click", acceptCookies);
  if (declineBtn) declineBtn.addEventListener("click", declineCookies);
});

// Calculate Reading Time
function calculateReadingTime() {
  const blogContent = document.querySelector(".blog-post-content");
  if (!blogContent) return;

  const text = blogContent.innerText || blogContent.textContent;
  const words = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words/min

  const readingTimeEl = document.querySelector(".reading-time");
  if (readingTimeEl) {
    readingTimeEl.innerHTML = `<span>⏱️</span> ${readingTime} min read`;
  }
}

// Generate Table of Contents
function generateTableOfContents() {
  const blogContent = document.querySelector(".blog-post-content");
  if (!blogContent) return;

  const headings = blogContent.querySelectorAll("h2");
  if (headings.length < 2) return; // Only show if 2+ headings

  const toc = document.createElement("div");
  toc.className = "table-of-contents";
  toc.innerHTML = `
    <h3>Table of Contents</h3>
    <ul>
      ${Array.from(headings).map((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        return `<li><a href="#${id}">${heading.textContent}</a></li>`;
      }).join("")}
    </ul>
  `;

  blogContent.insertBefore(toc, blogContent.firstChild);
}

// Initialize blog enhancements
document.addEventListener("DOMContentLoaded", () => {
  calculateReadingTime();
  generateTableOfContents();
});

// Chatbot functionality (site-wide)
{
  const chatbotWidget = document.getElementById("chatbotWidget");
  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbotClose = document.getElementById("chatbotClose");
  const chatbotMessages = document.getElementById("chatbotMessages");
  const chatbotInput = document.getElementById("chatbotInput");
  const chatbotSend = document.getElementById("chatbotSend");
  const quickReplyBtns = document.querySelectorAll(".quick-reply-btn");

  // Make sure functions are available immediately
  // These will be defined below, but we'll also log when they're ready
  console.log('🤖 Chatbot initialized. Use testChatbotAI() or checkChatbotAI() in console.');

  // Storage key for chat history
  const CHAT_STORAGE_KEY = "apex_chatbot_history";
  const CHAT_EXPIRY_HOURS = 24; // Chat history expires after 24 hours

  // AI Configuration for Ollama
  // Ollama runs locally - make sure it's installed and running
  // Install: https://ollama.ai
  // Run: ollama serve (usually runs on http://localhost:11434)
  const AI_CONFIG = {
    enabled: true, // Set to false to use keyword matching only
    baseUrl: "http://localhost:11434", // Ollama API base URL
    model: "llama2", // Popular models: llama2, mistral, codellama, phi, gemma
    temperature: 0.7,
    stream: false // Set to true for streaming responses (requires different handling)
  };

  // Get Ollama base URL (can be customized)
  function getOllamaUrl() {
    const customUrl = localStorage.getItem('apex_ollama_url');
    return customUrl || AI_CONFIG.baseUrl;
  }

  // Helper function to set Ollama URL (can be called from browser console)
  // Usage: window.setChatbotOllamaUrl('http://localhost:11434')
  window.setChatbotOllamaUrl = function(url) {
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL. Please provide a valid Ollama API URL.');
      return false;
    }
    // Remove trailing slash
    url = url.replace(/\/$/, '');
    localStorage.setItem('apex_ollama_url', url);
    console.log('✅ Ollama URL set successfully!', url);
    return true;
  };

  // Helper function to set Ollama model
  // Usage: window.setChatbotModel('mistral')
  window.setChatbotModel = function(model) {
    if (!model || typeof model !== 'string') {
      console.error('Invalid model name. Please provide a valid Ollama model name.');
      return false;
    }
    AI_CONFIG.model = model;
    localStorage.setItem('apex_ollama_model', model);
    console.log('✅ Model set successfully!', model);
    return true;
  };

  // Helper function to check if AI is configured
  window.checkChatbotAI = function() {
    const isEnabled = AI_CONFIG.enabled;
    const baseUrl = getOllamaUrl();
    const model = localStorage.getItem('apex_ollama_model') || AI_CONFIG.model;
    
    console.log('Chatbot AI Status:', {
      enabled: isEnabled,
      provider: 'Ollama',
      baseUrl: baseUrl,
      model: model,
      status: isEnabled ? '✅ Active (make sure Ollama is running)' : '⚠️ Disabled (using keyword matching)'
    });
    return { enabled: isEnabled, provider: 'Ollama', baseUrl, model };
  };

  // Test function to verify Ollama connection
  window.testChatbotAI = async function() {
    console.log('🧪 Testing Ollama connection...');
    const baseUrl = getOllamaUrl();
    const model = localStorage.getItem('apex_ollama_model') || AI_CONFIG.model;
    
    try {
      // Test if Ollama is reachable
      const testResponse = await fetch(`${baseUrl}/api/tags`, {
        method: "GET"
      });
      
      if (!testResponse.ok) {
        console.error('❌ Ollama connection failed:', testResponse.status, testResponse.statusText);
        console.log('💡 Make sure Ollama is running: ollama serve');
        return false;
      }
      
      const models = await testResponse.json();
      const modelExists = models.models?.some(m => m.name.includes(model.split(':')[0]));
      
      if (!modelExists) {
        console.warn('⚠️ Model not found:', model);
        console.log('💡 Pull the model first: ollama pull', model.split(':')[0]);
        console.log('Available models:', models.models?.map(m => m.name).join(', ') || 'none');
      } else {
        console.log('✅ Model found:', model);
      }
      
      // Test actual chat request
      console.log('🧪 Testing chat API...');
      const chatResponse = await getAIResponse('Hello, this is a test message.');
      
      if (chatResponse) {
        console.log('✅ Ollama is working! Response:', chatResponse.substring(0, 100) + '...');
        return true;
      } else {
        console.warn('⚠️ Ollama responded but returned no content');
        return false;
      }
    } catch (error) {
      console.error('❌ Ollama test failed:', error.message);
      console.log('💡 Troubleshooting:');
      console.log('   1. Make sure Ollama is installed: https://ollama.ai');
      console.log('   2. Start Ollama: ollama serve');
      console.log('   3. Pull a model: ollama pull', model.split(':')[0]);
      console.log('   4. Check if Ollama is running on:', baseUrl);
      return false;
    }
  };

  // Knowledge base for chatbot responses (used as context for AI and fallback)
  const knowledgeBase = {
    "services": {
      keywords: ["service", "what do you", "what can you", "offer", "build", "create"],
      response: "We offer several services:\n\n🌐 **Websites & Landing Pages** - Fast, modern sites with clean messaging\n⚡ **Custom Web Applications** - Portals, dashboards, internal tools with secure logins\n🔁 **Automation & Integrations** - Connect tools and automate repetitive processes\n🛡️ **Technical Consulting** - Clear scoping, architecture guidance, and roadmap planning\n\nWould you like more details about any specific service?"
    },
    "pricing": {
      keywords: ["price", "cost", "how much", "pricing", "rate", "budget", "expensive"],
      response: "Pricing varies based on project scope, complexity, and timeline. We provide custom quotes after understanding your specific requirements.\n\nMost projects range from a few thousand to tens of thousands depending on the work involved.\n\n**Simple websites**: Typically $2,000 - $5,000\n**Custom web apps**: $5,000 - $25,000+\n**Automation projects**: $1,500 - $10,000+\n\nContact us for a detailed estimate tailored to your needs!"
    },
    "timeline": {
      keywords: ["how long", "timeline", "duration", "when", "time", "deadline", "schedule"],
      response: "Timeline depends on project complexity:\n\n**Simple websites**: 2-4 weeks\n**Custom applications**: 6-12 weeks or more\n**Automation projects**: 2-8 weeks\n\nWe work in milestones with regular updates, so you'll always know where things stand. We can discuss your timeline during the discovery phase.\n\nDo you have a specific deadline in mind?"
    },
    "technologies": {
      keywords: ["technology", "tech stack", "what do you use", "framework", "language", "tools"],
      response: "We use modern, industry-standard technologies:\n\n**Frontend**: React, Vue, HTML5, CSS3, JavaScript/TypeScript\n**Backend**: Node.js, Python, various APIs\n**Cloud**: AWS, Azure, and other cloud platforms\n\nWe choose the best stack for each project based on requirements, scalability needs, and your team's preferences.\n\nIs there a specific technology you're interested in?"
    },
    "process": {
      keywords: ["process", "how do you work", "workflow", "steps", "methodology"],
      response: "We follow a structured 4-step process:\n\n**1. Discovery** - Clarify goals, users, requirements, and constraints\n**2. Build** - Deliver in milestones with quick feedback loops\n**3. Launch** - Go live with performance, security, and usability checks\n**4. Support** - Updates, enhancements, and continuous improvement\n\nYou'll have regular check-ins and opportunities to provide feedback throughout. Want to know more about any step?"
    },
    "contact": {
      keywords: ["contact", "email", "phone", "reach", "get in touch"],
      response: "You can reach us at:\n\n📧 **Email**: info@apextsgroup.com\n\nOr simply fill out the contact form on this page! We typically respond within 24 hours.\n\nIs there something specific you'd like to discuss?"
    },
    "default": {
      response: "I'm here to help! I can answer questions about:\n\n• Our services\n• Pricing and estimates\n• Project timelines\n• Technologies we use\n• Our development process\n\nWhat would you like to know?"
    }
  };

  // Function to find the best response (keyword matching fallback)
  function findResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, data] of Object.entries(knowledgeBase)) {
      if (key === "default") continue;
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return data.response;
      }
    }
    
    return knowledgeBase.default.response;
  }

  // Build system prompt from knowledge base
  function buildSystemPrompt() {
    let prompt = "You are a helpful customer service chatbot for Apex Technical Solutions Group, a web development and automation company.\n\n";
    prompt += "Company Information:\n";
    prompt += "- Services: Websites & Landing Pages, Custom Web Applications, Automation & Integrations, Technical Consulting\n";
    prompt += "- Contact: info@apextsgroup.com\n";
    prompt += "- Process: Discovery → Build → Launch → Support\n\n";
    prompt += "Pricing Guidelines:\n";
    prompt += "- Simple websites: $2,000 - $5,000\n";
    prompt += "- Custom web apps: $5,000 - $25,000+\n";
    prompt += "- Automation projects: $1,500 - $10,000+\n\n";
    prompt += "Timeline Guidelines:\n";
    prompt += "- Simple websites: 2-4 weeks\n";
    prompt += "- Custom applications: 6-12 weeks or more\n";
    prompt += "- Automation projects: 2-8 weeks\n\n";
    prompt += "Technologies: React, Vue, HTML5, CSS3, JavaScript/TypeScript, Node.js, Python, AWS, Azure\n\n";
    prompt += "Be friendly, professional, and helpful. Keep responses concise and informative. If asked about something not in your knowledge, politely direct them to contact info@apextsgroup.com for more details.";
    return prompt;
  }

  // Get conversation history for AI context
  function getConversationHistory() {
    if (!chatbotMessages) return [];
    const messages = [];
    chatbotMessages.querySelectorAll(".chatbot-message").forEach(msg => {
      const isUser = msg.classList.contains("user-message");
      const text = msg.querySelector(".message-content p").textContent.trim();
      if (text) {
        messages.push({
          role: isUser ? "user" : "assistant",
          content: text
        });
      }
    });
    return messages;
  }

  // Call Ollama API
  async function getAIResponse(userMessage) {
    if (!AI_CONFIG.enabled) {
      return null; // Fall back to keyword matching
    }

    try {
      const conversationHistory = getConversationHistory();
      const baseUrl = getOllamaUrl();
      const model = localStorage.getItem('apex_ollama_model') || AI_CONFIG.model;
      
      // Build messages array for Ollama API
      // Ollama uses a similar format to OpenAI but includes system message in messages array
      const messages = [
        { role: "system", content: buildSystemPrompt() },
        ...conversationHistory.slice(-10), // Last 10 messages for context
        { role: "user", content: userMessage }
      ];

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: AI_CONFIG.stream,
          options: {
            temperature: AI_CONFIG.temperature
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        console.error("Ollama API error:", error);
        
        // Check for CORS/403 errors
        if (response.status === 403 || response.status === 0) {
          console.error("❌ CORS Error (403): Ollama is blocking requests from this domain.");
          console.log("💡 Fix: Set OLLAMA_ORIGINS environment variable:");
          console.log(`   $env:OLLAMA_ORIGINS="${window.location.origin}"`);
          console.log("   Then restart Ollama: ollama serve");
        } else if (response.status === 500) {
          console.warn("⚠️ Ollama may not be running. Make sure Ollama is installed and running on", baseUrl);
        }
        
        return null; // Fall back to keyword matching
      }

      const data = await response.json();
      
      // Ollama response format: { message: { content: "...", role: "assistant" }, ... }
      const aiResponse = data.message?.content?.trim() || null;
      
      if (aiResponse) {
        console.log("✅ Ollama AI Response received successfully!");
        console.log("Model:", model, "| URL:", baseUrl);
      }
      
      return aiResponse;
    } catch (error) {
      console.error("Error calling Ollama API:", error);
      
      // Network errors usually mean Ollama isn't running or CORS is blocking
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const isCorsError = error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin');
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = getOllamaUrl().includes('localhost') || getOllamaUrl().includes('127.0.0.1');
        
        if (isHttps && isLocalhost && getOllamaUrl().startsWith('http://')) {
          console.error("❌ Mixed Content Error: Cannot access HTTP localhost from HTTPS website.");
          console.log("💡 Solutions:");
          console.log("   1. Use a backend proxy (recommended for production)");
          console.log("   2. For local testing, access site via http://localhost instead of https://");
          console.log("   3. Set up Ollama behind HTTPS reverse proxy");
        } else if (isCorsError || (isHttps && !isLocalhost)) {
          console.error("❌ CORS Error: Ollama is blocking cross-origin requests.");
          console.log("💡 Solution: Set OLLAMA_ORIGINS environment variable before starting Ollama:");
          console.log(`   Windows: $env:OLLAMA_ORIGINS='${window.location.origin}'`);
          console.log(`   Linux/Mac: export OLLAMA_ORIGINS='${window.location.origin}'`);
          console.log("   Then restart: ollama serve");
        } else {
          console.warn("⚠️ Cannot connect to Ollama. Make sure Ollama is running on", getOllamaUrl());
        }
      }
      
      return null; // Fall back to keyword matching
    }
  }

  // Save chat history to localStorage
  function saveChatHistory() {
    if (!chatbotMessages) return;
    const messages = [];
    chatbotMessages.querySelectorAll(".chatbot-message").forEach(msg => {
      const isUser = msg.classList.contains("user-message");
      const text = msg.querySelector(".message-content p").innerHTML.replace(/<br>/g, "\n");
      messages.push({ text, isUser });
    });
    const chatData = {
      messages: messages,
      timestamp: Date.now()
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatData));
  }

  // Load chat history from localStorage
  function loadChatHistory() {
    if (!chatbotMessages) return false;
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!saved) return false;

      const chatData = JSON.parse(saved);
      const now = Date.now();
      const expiryTime = CHAT_EXPIRY_HOURS * 60 * 60 * 1000;

      // Check if chat history has expired
      if (now - chatData.timestamp > expiryTime) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        return false;
      }

      // Clear the initial welcome message
      chatbotMessages.innerHTML = "";

      // Restore all messages
      chatData.messages.forEach(msg => {
        addMessageToDOM(msg.text, msg.isUser, false); // false = don't save (we're loading)
      });

      return true;
    } catch (e) {
      console.error("Error loading chat history:", e);
      return false;
    }
  }

  // Add message to DOM (internal function)
  function addMessageToDOM(text, isUser = false, shouldSave = true) {
    if (!chatbotMessages) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message ${isUser ? "user-message" : "bot-message"}`;
    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${text.replace(/\n/g, "<br>")}</p>
      </div>
    `;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
    if (shouldSave) {
      saveChatHistory();
    }
  }

  // Function to add message to chat (public API)
  function addMessage(text, isUser = false) {
    addMessageToDOM(text, isUser, true);
  }

  // Show typing indicator
  function showTypingIndicator() {
    if (!chatbotMessages) return;
    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-message bot-message typing-indicator";
    typingDiv.id = "typing-indicator";
    typingDiv.innerHTML = `
      <div class="message-content">
        <p><span class="typing-dots"><span>.</span><span>.</span><span>.</span></span></p>
      </div>
    `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  // Function to send message
  async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatbotInput.value = "";

    // Disable input while processing
    if (chatbotInput) chatbotInput.disabled = true;
    if (chatbotSend) chatbotSend.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    try {
      // Try AI first
      let response = await getAIResponse(message);
      
      // Fall back to keyword matching if AI fails
      if (!response) {
        console.log('⚠️ Using keyword matching fallback (Ollama not available or failed)');
        response = findResponse(message);
      } else {
        console.log('✅ Using Ollama AI response');
      }

      // Remove typing indicator and add response
      removeTypingIndicator();
      addMessage(response);
    } catch (error) {
      console.error("Error getting response:", error);
      removeTypingIndicator();
      // Fall back to keyword matching on error
      const fallbackResponse = findResponse(message);
      addMessage(fallbackResponse);
    } finally {
      // Re-enable input
      if (chatbotInput) chatbotInput.disabled = false;
      if (chatbotSend) chatbotSend.disabled = false;
      if (chatbotInput) chatbotInput.focus();
    }
  }

  // Initialize: Load chat history on page load
  if (chatbotMessages) {
    const hasHistory = loadChatHistory();
    // If no history was loaded, keep the default welcome message
    // (it's already in the HTML)
  }

  // Save chatbot state (open/closed)
  function saveChatbotState(isOpen) {
    localStorage.setItem("apex_chatbot_open", isOpen ? "true" : "false");
  }

  // Load chatbot state
  function loadChatbotState() {
    const saved = localStorage.getItem("apex_chatbot_open");
    if (saved === "true" && chatbotWidget && chatbotToggle) {
      chatbotWidget.classList.add("open");
      chatbotToggle.classList.add("hidden");
    }
  }

  // Toggle chatbot
  if (chatbotToggle) {
    chatbotToggle.addEventListener("click", () => {
      chatbotWidget.classList.add("open");
      chatbotToggle.classList.add("hidden");
      chatbotInput.focus();
      saveChatbotState(true);
    });
  }

  // Close chatbot
  if (chatbotClose) {
    chatbotClose.addEventListener("click", () => {
      chatbotWidget.classList.remove("open");
      chatbotToggle.classList.remove("hidden");
      saveChatbotState(false);
    });
  }

  // Load chatbot state on page load
  loadChatbotState();

  // Update chatbot status indicator
  function updateChatbotStatus() {
    const statusElement = document.querySelector('.chatbot-status');
    if (!statusElement) return;
    
    if (!AI_CONFIG.enabled) {
      statusElement.textContent = 'Keyword Matching';
      statusElement.style.color = 'var(--muted)';
      return;
    }
    
    // Test connection asynchronously
    const baseUrl = getOllamaUrl();
    fetch(`${baseUrl}/api/tags`)
      .then(response => {
        if (response.ok) {
          statusElement.textContent = 'AI Active';
          statusElement.style.color = '#22c55e'; // Green
        } else {
          statusElement.textContent = 'AI Offline';
          statusElement.style.color = '#ef4444'; // Red
        }
      })
      .catch(() => {
        statusElement.textContent = 'AI Offline';
        statusElement.style.color = '#ef4444'; // Red
      });
  }

  // Update status on page load
  updateChatbotStatus();
  
  // Update status every 30 seconds
  setInterval(updateChatbotStatus, 30000);

  // Verify functions are available (for debugging)
  if (typeof window.testChatbotAI === 'function' && typeof window.checkChatbotAI === 'function') {
    console.log('✅ Chatbot helper functions loaded:', {
      testChatbotAI: 'Available - Run testChatbotAI() to test Ollama',
      checkChatbotAI: 'Available - Run checkChatbotAI() to check status',
      setChatbotOllamaUrl: 'Available - Run setChatbotOllamaUrl(url) to change URL',
      setChatbotModel: 'Available - Run setChatbotModel(name) to change model'
    });
  }

  // Send button
  if (chatbotSend) {
    chatbotSend.addEventListener("click", sendMessage);
  }

  // Enter key to send
  if (chatbotInput) {
    chatbotInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }

  // Quick reply buttons
  quickReplyBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const question = btn.getAttribute("data-question");
      addMessage(question, true);
      
      // Disable input while processing
      if (chatbotInput) chatbotInput.disabled = true;
      if (chatbotSend) chatbotSend.disabled = true;
      
      showTypingIndicator();
      
      try {
        let response = await getAIResponse(question);
        if (!response) {
          response = findResponse(question);
        }
        removeTypingIndicator();
        addMessage(response);
      } catch (error) {
        console.error("Error getting response:", error);
        removeTypingIndicator();
        const fallbackResponse = findResponse(question);
        addMessage(fallbackResponse);
      } finally {
        if (chatbotInput) chatbotInput.disabled = false;
        if (chatbotSend) chatbotSend.disabled = false;
        if (chatbotInput) chatbotInput.focus();
      }
    });
  });
}

// ============================================
// CLIENT PORTAL AUTHENTICATION
// ============================================

// Authentication state management
const Auth = {
  // Demo credentials (in production, this would be handled by a backend)
  DEMO_CREDENTIALS: {
    'demo@apextsgroup.com': { password: 'demo123', name: 'Demo Client', clientId: 'demo-001' },
    'client@example.com': { password: 'client123', name: 'John Smith', clientId: 'client-002' }
  },

  // Get current session
  getSession() {
    const session = localStorage.getItem('client_session');
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // Set session
  setSession(email, userData) {
    const session = {
      email,
      name: userData.name,
      clientId: userData.clientId,
      loginTime: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    localStorage.setItem('client_session', JSON.stringify(session));
    return session;
  },

  // Clear session
  clearSession() {
    localStorage.removeItem('client_session');
  },

  // Check if session is valid
  isValidSession() {
    const session = this.getSession();
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.clearSession();
      return false;
    }
    return true;
  },

  // Authenticate user
  authenticate(email, password) {
    const user = this.DEMO_CREDENTIALS[email.toLowerCase()];
    if (user && user.password === password) {
      return this.setSession(email, user);
    }
    return null;
  },

  // Get demo client data
  getClientData(clientId) {
    // Mock data - in production, this would come from an API
    const mockData = {
      'demo-001': {
        name: 'Demo Client',
        email: 'demo@apextsgroup.com',
        plan: {
          name: 'Professional',
          monthlyLimit: 1000, // messages per month
          price: 99,
          overageRate: 0.10 // $0.10 per message over limit
        },
        usage: {
          currentMonth: 1247,
          lastMonth: 892,
          totalMessages: 5234,
          totalSessions: 342,
          averageResponseTime: 1.2,
          satisfaction: 4.6
        },
        billing: {
          currentBill: 124.70,
          basePrice: 99,
          overageMessages: 247,
          overageCost: 24.70,
          nextBillingDate: '2024-04-01'
        },
        chatSessions: [
          {
            id: 'chat-001',
            visitorName: 'Sarah Johnson',
            visitorEmail: 'sarah@example.com',
            startTime: '2024-03-28T14:23:00',
            endTime: '2024-03-28T14:35:00',
            duration: 12,
            messageCount: 8,
            status: 'completed',
            rating: 5,
            messages: [
              { role: 'user', content: 'Hi, I need help with pricing', timestamp: '2024-03-28T14:23:15' },
              { role: 'assistant', content: 'Hello! I\'d be happy to help you with pricing information. What type of project are you interested in?', timestamp: '2024-03-28T14:23:18' },
              { role: 'user', content: 'I need a website for my business', timestamp: '2024-03-28T14:24:02' },
              { role: 'assistant', content: 'Great! For websites, our pricing typically ranges from $2,000 to $5,000 depending on complexity. Would you like to schedule a consultation?', timestamp: '2024-03-28T14:24:05' },
              { role: 'user', content: 'Yes, that would be helpful', timestamp: '2024-03-28T14:25:10' },
              { role: 'assistant', content: 'Perfect! You can fill out our contact form or email us at info@apextsgroup.com. We typically respond within 24 hours.', timestamp: '2024-03-28T14:25:13' },
              { role: 'user', content: 'Thank you!', timestamp: '2024-03-28T14:25:45' },
              { role: 'assistant', content: 'You\'re welcome! Have a great day!', timestamp: '2024-03-28T14:25:47' }
            ]
          },
          {
            id: 'chat-002',
            visitorName: 'Mike Chen',
            visitorEmail: 'mike@techcorp.com',
            startTime: '2024-03-28T15:10:00',
            endTime: null,
            duration: 0,
            messageCount: 3,
            status: 'active',
            rating: null,
            messages: [
              { role: 'user', content: 'What technologies do you use?', timestamp: '2024-03-28T15:10:12' },
              { role: 'assistant', content: 'We use modern technologies like React, Vue, Node.js, Python, and cloud platforms like AWS and Azure.', timestamp: '2024-03-28T15:10:15' },
              { role: 'user', content: 'Do you work with Python specifically?', timestamp: '2024-03-28T15:11:30' }
            ]
          },
          {
            id: 'chat-003',
            visitorName: 'Anonymous',
            visitorEmail: null,
            startTime: '2024-03-27T10:15:00',
            endTime: '2024-03-27T10:18:00',
            duration: 3,
            messageCount: 4,
            status: 'completed',
            rating: 4,
            messages: [
              { role: 'user', content: 'How long does a project take?', timestamp: '2024-03-27T10:15:20' },
              { role: 'assistant', content: 'Project timelines vary: Simple websites take 2-4 weeks, custom applications take 6-12 weeks or more.', timestamp: '2024-03-27T10:15:23' },
              { role: 'user', content: 'Thanks', timestamp: '2024-03-27T10:17:45' },
              { role: 'assistant', content: 'You\'re welcome!', timestamp: '2024-03-27T10:17:47' }
            ]
          }
        ],
        services: [
          {
            id: 'svc-001',
            name: 'Website Development',
            status: 'active',
            progress: 85,
            startDate: '2024-01-15',
            description: 'Custom website with e-commerce integration',
            lastUpdate: '2024-03-20'
          },
          {
            id: 'svc-002',
            name: 'Automation System',
            status: 'active',
            progress: 100,
            startDate: '2024-02-01',
            description: 'Workflow automation for order processing',
            lastUpdate: '2024-03-15'
          },
          {
            id: 'svc-003',
            name: 'Maintenance & Support',
            status: 'active',
            progress: 100,
            startDate: '2024-01-01',
            description: 'Monthly maintenance and support package',
            lastUpdate: '2024-03-25'
          }
        ],
        reports: [
          {
            id: 'rpt-001',
            title: 'Monthly Performance Report - March 2024',
            date: '2024-03-25',
            type: 'performance',
            summary: 'Website uptime: 99.9%, Average load time: 1.2s, Traffic increase: 15%'
          },
          {
            id: 'rpt-002',
            title: 'Automation System Analysis',
            date: '2024-03-15',
            type: 'analysis',
            summary: 'Processed 1,250 orders automatically, Saved 45 hours of manual work'
          },
          {
            id: 'rpt-003',
            title: 'Security Audit Report',
            date: '2024-03-10',
            type: 'security',
            summary: 'All systems secure, No vulnerabilities detected, SSL certificate valid'
          }
        ],
        stats: {
          totalServices: 3,
          completedProjects: 2,
          uptime: 99.9
        }
      },
      'client-002': {
        name: 'John Smith',
        email: 'client@example.com',
        plan: {
          name: 'Starter',
          monthlyLimit: 500,
          price: 49,
          overageRate: 0.15
        },
        usage: {
          currentMonth: 342,
          lastMonth: 298,
          totalMessages: 1234,
          totalSessions: 89,
          averageResponseTime: 1.5,
          satisfaction: 4.3
        },
        billing: {
          currentBill: 49.00,
          basePrice: 49,
          overageMessages: 0,
          overageCost: 0,
          nextBillingDate: '2024-04-01'
        },
        chatSessions: [
          {
            id: 'chat-004',
            visitorName: 'Alex Martinez',
            visitorEmail: 'alex@startup.com',
            startTime: '2024-03-28T16:20:00',
            endTime: '2024-03-28T16:25:00',
            duration: 5,
            messageCount: 6,
            status: 'completed',
            rating: 5,
            messages: [
              { role: 'user', content: 'I need help with automation', timestamp: '2024-03-28T16:20:15' },
              { role: 'assistant', content: 'I can help with automation! What processes would you like to automate?', timestamp: '2024-03-28T16:20:18' },
              { role: 'user', content: 'Order processing and inventory updates', timestamp: '2024-03-28T16:21:30' },
              { role: 'assistant', content: 'Great! We can automate order processing and sync inventory in real-time. Would you like to schedule a consultation?', timestamp: '2024-03-28T16:21:33' },
              { role: 'user', content: 'Yes please', timestamp: '2024-03-28T16:22:10' },
              { role: 'assistant', content: 'Perfect! Please fill out our contact form and we\'ll get back to you within 24 hours.', timestamp: '2024-03-28T16:22:13' }
            ]
          }
        ],
        services: [
          {
            id: 'svc-004',
            name: 'Custom Web Application',
            status: 'in-progress',
            progress: 60,
            startDate: '2024-02-20',
            description: 'Internal portal for team management',
            lastUpdate: '2024-03-22'
          }
        ],
        reports: [
          {
            id: 'rpt-004',
            title: 'Project Status Update - March 2024',
            date: '2024-03-22',
            type: 'status',
            summary: 'Development 60% complete, Testing phase scheduled for next week'
          }
        ],
        stats: {
          totalServices: 1,
          completedProjects: 0,
          uptime: 100
        }
      }
    };
    
    // Add default values if missing
    const client = mockData[clientId] || mockData['demo-001'];
    if (!client.plan) {
      client.plan = { name: 'Basic', monthlyLimit: 500, price: 49, overageRate: 0.15 };
    }
    if (!client.usage) {
      client.usage = { currentMonth: 0, lastMonth: 0, totalMessages: 0, totalSessions: 0, averageResponseTime: 0, satisfaction: 0 };
    }
    if (!client.billing) {
      client.billing = { currentBill: client.plan.price, basePrice: client.plan.price, overageMessages: 0, overageCost: 0, nextBillingDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] };
    }
    if (!client.chatSessions) {
      client.chatSessions = [];
    }
    
    return client;
  }
};

// Update navigation to show login/dashboard link
function updateNavigation() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const isLoggedIn = Auth.isValidSession();
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes('/login/');
  const isDashboardPage = currentPath.includes('/dashboard/');

  // Remove existing login/dashboard link
  const existingLink = nav.querySelector('a[href="/login/"], a[href="/dashboard/"]');
  if (existingLink) {
    existingLink.remove();
  }

  // Add appropriate link
  if (isLoggedIn && !isDashboardPage) {
    const dashboardLink = document.createElement('a');
    dashboardLink.href = '/dashboard/';
    dashboardLink.textContent = 'Dashboard';
    if (isDashboardPage) {
      dashboardLink.classList.add('active');
    }
    nav.appendChild(dashboardLink);
  } else if (!isLoggedIn && !isLoginPage) {
    const loginLink = document.createElement('a');
    loginLink.href = '/login/';
    loginLink.textContent = 'Client Login';
    nav.appendChild(loginLink);
  }
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');
    const buttonText = document.getElementById('login-button-text');
    const loadingText = document.getElementById('login-loading');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');

    // Validation
    if (!email || !password) {
      errorDiv.textContent = 'Please fill in all fields';
      errorDiv.style.display = 'block';
      if (!email) emailInput.classList.add('error');
      if (!password) passwordInput.classList.add('error');
      return;
    }

    // Show loading state
    buttonText.style.display = 'none';
    loadingText.style.display = 'inline';

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Authenticate
    const session = Auth.authenticate(email, password);
    
    if (session) {
      // Success - redirect to dashboard
      window.location.href = '/dashboard/';
    } else {
      // Error
      errorDiv.textContent = 'Invalid email or password. Please try again.';
      errorDiv.style.display = 'block';
      emailInput.classList.add('error');
      passwordInput.classList.add('error');
      buttonText.style.display = 'inline';
      loadingText.style.display = 'none';
    }
  });
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to sign out?')) {
    Auth.clearSession();
    window.location.href = '/login/';
  }
}

// Dashboard initialization
function initDashboard() {
  const session = Auth.getSession();
  
  if (!session || !Auth.isValidSession()) {
    window.location.href = '/login/';
    return;
  }

  // Get client data
  const clientData = Auth.getClientData(session.clientId);
  
  // Update header
  const clientNameEl = document.getElementById('client-name');
  if (clientNameEl) {
    clientNameEl.textContent = clientData.name;
  }

  // Update stats
  const totalServicesEl = document.getElementById('total-services');
  const completedProjectsEl = document.getElementById('completed-projects');
  const uptimePercentEl = document.getElementById('uptime-percent');
  const lastUpdateEl = document.getElementById('last-update');

  if (totalServicesEl) totalServicesEl.textContent = clientData.stats.totalServices;
  if (completedProjectsEl) completedProjectsEl.textContent = clientData.stats.completedProjects;
  if (uptimePercentEl) uptimePercentEl.textContent = clientData.stats.uptime + '%';
  if (lastUpdateEl) {
    const today = new Date();
    lastUpdateEl.textContent = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Render services
  const servicesContainer = document.getElementById('services-container');
  if (servicesContainer && clientData.services) {
    servicesContainer.innerHTML = clientData.services.map(service => `
      <div class="service-card">
        <div class="service-header">
          <div>
            <h3 style="margin:0 0 4px;font-size:20px;">${service.name}</h3>
            <p style="margin:0;color:var(--muted);font-size:14px;">${service.description}</p>
          </div>
          <span class="service-status status-${service.status}">${service.status === 'active' ? 'Active' : service.status === 'in-progress' ? 'In Progress' : 'Completed'}</span>
        </div>
        <div class="service-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${service.progress}%"></div>
          </div>
          <div class="service-meta">
            <span>${service.progress}% Complete</span>
            <span>Started: ${new Date(service.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>Last Update: ${new Date(service.lastUpdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render reports
  const reportsContainer = document.getElementById('reports-container');
  if (reportsContainer && clientData.reports) {
    reportsContainer.innerHTML = clientData.reports.map(report => {
      const typeIcons = {
        performance: '📊',
        analysis: '📈',
        security: '🔒',
        status: '📋'
      };
      return `
        <div class="report-card">
          <div class="report-icon">${typeIcons[report.type] || '📄'}</div>
          <div class="report-content">
            <h3 style="margin:0 0 8px;font-size:18px;">${report.title}</h3>
            <p style="margin:0 0 12px;color:var(--muted);font-size:14px;line-height:1.6;">${report.summary}</p>
            <div class="report-meta">
              <span>${new Date(report.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <a href="/contact/" class="report-link">View Details →</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Load automation services for overview
  loadAutomationServicesForOverview();

  // Initialize tabs
  initDashboardTabs();
  
  // Render chat sessions
  renderChatSessions(clientData);
  
  // Render usage reports
  renderUsageReports(clientData);
  
  // Render billing
  renderBilling(clientData);
}

// Dashboard tabs functionality
function initDashboardTabs() {
  const tabs = document.querySelectorAll('.dashboard-tab');
  const tabContents = document.querySelectorAll('.dashboard-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Render chat sessions
function renderChatSessions(clientData) {
  const container = document.getElementById('chat-sessions-container');
  if (!container || !clientData.chatSessions) return;
  
  const sessions = clientData.chatSessions.sort((a, b) => {
    return new Date(b.startTime) - new Date(a.startTime);
  });
  
  container.innerHTML = sessions.map(session => {
    const startDate = new Date(session.startTime);
    const statusBadge = session.status === 'active' 
      ? '<span class="status-badge active">Active</span>'
      : '<span class="status-badge completed">Completed</span>';
    const ratingStars = session.rating 
      ? '⭐'.repeat(session.rating) + ' (' + session.rating + '/5)'
      : 'No rating';
    
    return `
      <div class="chat-session-card" data-session-id="${session.id}">
        <div class="chat-session-header">
          <div>
            <h3 style="margin:0 0 4px;font-size:18px;">${session.visitorName || 'Anonymous Visitor'}</h3>
            <p style="margin:0;color:var(--muted);font-size:14px;">
              ${session.visitorEmail || 'No email provided'} • ${startDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          ${statusBadge}
        </div>
        <div class="chat-session-stats">
          <span>💬 ${session.messageCount} messages</span>
          <span>⏱️ ${session.duration || 'Ongoing'} min</span>
          <span>${ratingStars}</span>
        </div>
        <div class="chat-session-preview">
          <p style="margin:0;color:var(--muted);font-size:13px;font-style:italic;">
            "${session.messages[0]?.content.substring(0, 80)}${session.messages[0]?.content.length > 80 ? '...' : ''}"
          </p>
        </div>
        <div class="chat-session-actions">
          <button class="btn" onclick="viewChatSession('${session.id}')">View Full Chat</button>
          ${session.status === 'active' ? `<button class="btn primary" onclick="takeoverChat('${session.id}')">Take Over</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// View full chat session
function viewChatSession(sessionId) {
  const session = getChatSession(sessionId);
  if (!session) return;
  
  const modal = document.createElement('div');
  modal.className = 'chat-modal';
  modal.innerHTML = `
    <div class="chat-modal-content">
      <div class="chat-modal-header">
        <h2>Chat Session: ${session.visitorName || 'Anonymous'}</h2>
        <button class="chat-modal-close" onclick="this.closest('.chat-modal').remove()">✕</button>
      </div>
      <div class="chat-modal-body">
        <div class="chat-session-info">
          <p><strong>Started:</strong> ${new Date(session.startTime).toLocaleString()}</p>
          ${session.endTime ? `<p><strong>Ended:</strong> ${new Date(session.endTime).toLocaleString()}</p>` : '<p><strong>Status:</strong> Active</p>'}
          <p><strong>Duration:</strong> ${session.duration || 'Ongoing'} minutes</p>
          <p><strong>Messages:</strong> ${session.messageCount}</p>
          ${session.rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(session.rating)} (${session.rating}/5)</p>` : ''}
        </div>
        <div class="chat-messages-view">
          ${session.messages.map(msg => `
            <div class="chat-message-view ${msg.role === 'user' ? 'user-msg' : 'bot-msg'}">
              <div class="chat-msg-header">
                <strong>${msg.role === 'user' ? session.visitorName || 'Visitor' : 'AI Assistant'}</strong>
                <span style="color:var(--muted);font-size:12px;">${new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div class="chat-msg-content">${msg.content}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ${session.status === 'active' ? `
        <div class="chat-modal-footer">
          <button class="btn primary" onclick="takeoverChat('${sessionId}'); this.closest('.chat-modal').remove();">Take Over Chat</button>
        </div>
      ` : ''}
    </div>
  `;
  document.body.appendChild(modal);
}

// Take over chat session
function takeoverChat(sessionId) {
  const session = getChatSession(sessionId);
  if (!session) return;
  
  if (confirm(`Take over this chat session with ${session.visitorName || 'Anonymous Visitor'}? You will be able to respond manually.`)) {
    // In production, this would send a request to the backend
    alert('Chat takeover initiated! You can now respond manually to this conversation.');
    // Update session status
    session.status = 'taken-over';
    renderChatSessions(Auth.getClientData(Auth.getSession().clientId));
  }
}

// Get chat session by ID
function getChatSession(sessionId) {
  const clientData = Auth.getClientData(Auth.getSession().clientId);
  return clientData.chatSessions?.find(s => s.id === sessionId);
}

// Render usage reports
function renderUsageReports(clientData) {
  const container = document.getElementById('usage-reports-container');
  if (!container || !clientData.usage) return;
  
  const usage = clientData.usage;
  const usagePercent = ((usage.currentMonth / (clientData.plan?.monthlyLimit || 1000)) * 100).toFixed(1);
  const isOverLimit = usage.currentMonth > (clientData.plan?.monthlyLimit || 1000);
  
  container.innerHTML = `
    <div class="usage-overview">
      <div class="usage-stat-card">
        <div class="usage-stat-icon">💬</div>
        <div class="usage-stat-content">
          <div class="usage-stat-value">${usage.currentMonth.toLocaleString()}</div>
          <div class="usage-stat-label">Messages This Month</div>
          <div class="usage-stat-sublabel ${isOverLimit ? 'over-limit' : ''}">
            ${isOverLimit ? `⚠️ ${usagePercent}% of limit` : `${usagePercent}% of monthly limit`}
          </div>
        </div>
      </div>
      <div class="usage-stat-card">
        <div class="usage-stat-icon">📊</div>
        <div class="usage-stat-content">
          <div class="usage-stat-value">${usage.totalMessages.toLocaleString()}</div>
          <div class="usage-stat-label">Total Messages</div>
          <div class="usage-stat-sublabel">All time</div>
        </div>
      </div>
      <div class="usage-stat-card">
        <div class="usage-stat-icon">👥</div>
        <div class="usage-stat-content">
          <div class="usage-stat-value">${usage.totalSessions}</div>
          <div class="usage-stat-label">Total Sessions</div>
          <div class="usage-stat-sublabel">${usage.lastMonth} last month</div>
        </div>
      </div>
      <div class="usage-stat-card">
        <div class="usage-stat-icon">⚡</div>
        <div class="usage-stat-content">
          <div class="usage-stat-value">${usage.averageResponseTime}s</div>
          <div class="usage-stat-label">Avg Response Time</div>
          <div class="usage-stat-sublabel">${usage.satisfaction ? '⭐ ' + usage.satisfaction + '/5' : 'N/A'}</div>
        </div>
      </div>
    </div>
    
    <div class="usage-chart-container">
      <h3 style="margin:0 0 16px;font-size:20px;">Monthly Usage Trend</h3>
      <div class="usage-chart">
        <div class="usage-bar" style="height:${Math.min((usage.currentMonth / (clientData.plan?.monthlyLimit || 1000)) * 100, 100)}%">
          <span class="usage-bar-label">This Month: ${usage.currentMonth}</span>
        </div>
        <div class="usage-bar" style="height:${(usage.lastMonth / (clientData.plan?.monthlyLimit || 1000)) * 100}%">
          <span class="usage-bar-label">Last Month: ${usage.lastMonth}</span>
        </div>
      </div>
      <div class="usage-chart-labels">
        <span>This Month</span>
        <span>Last Month</span>
      </div>
    </div>
  `;
}

// Render billing information
function renderBilling(clientData) {
  const container = document.getElementById('billing-container');
  if (!container || !clientData.billing || !clientData.plan) return;
  
  const billing = clientData.billing;
  const plan = clientData.plan;
  const usage = clientData.usage;
  const isOverLimit = usage.currentMonth > plan.monthlyLimit;
  const remainingMessages = Math.max(0, plan.monthlyLimit - usage.currentMonth);
  
  container.innerHTML = `
    <div class="billing-overview">
      <div class="billing-plan-card">
        <h3 style="margin:0 0 8px;font-size:20px;">Current Plan</h3>
        <div class="plan-name">${plan.name}</div>
        <div class="plan-price">$${plan.price.toFixed(2)}<span class="plan-period">/month</span></div>
        <div class="plan-limit">${plan.monthlyLimit.toLocaleString()} messages/month</div>
      </div>
      
      <div class="billing-usage-card">
        <h3 style="margin:0 0 16px;font-size:20px;">Current Usage</h3>
        <div class="usage-meter">
          <div class="usage-meter-bar">
            <div class="usage-meter-fill" style="width:${Math.min((usage.currentMonth / plan.monthlyLimit) * 100, 100)}%"></div>
          </div>
          <div class="usage-meter-labels">
            <span>${usage.currentMonth.toLocaleString()} / ${plan.monthlyLimit.toLocaleString()} messages</span>
            ${isOverLimit ? `<span class="over-limit-badge">⚠️ Over Limit</span>` : `<span>${remainingMessages.toLocaleString()} remaining</span>`}
          </div>
        </div>
        ${isOverLimit ? `
          <div class="overage-warning">
            <strong>⚠️ You are over your monthly limit!</strong>
            <p>You've used ${(usage.currentMonth - plan.monthlyLimit).toLocaleString()} extra messages this month.</p>
          </div>
        ` : ''}
      </div>
    </div>
    
    <div class="billing-details">
      <h3 style="margin:0 0 16px;font-size:20px;">Current Bill</h3>
      <div class="billing-breakdown">
        <div class="billing-line">
          <span>Base Plan (${plan.name})</span>
          <span>$${billing.basePrice.toFixed(2)}</span>
        </div>
        ${isOverLimit ? `
          <div class="billing-line">
            <span>Overage (${billing.overageMessages.toLocaleString()} messages × $${plan.overageRate.toFixed(2)})</span>
            <span class="overage-cost">$${billing.overageCost.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="billing-line billing-total">
          <span><strong>Total Due</strong></span>
          <span><strong>$${billing.currentBill.toFixed(2)}</strong></span>
        </div>
      </div>
      <div class="billing-next-date">
        <p style="margin:16px 0 0;color:var(--muted);">
          Next billing date: <strong>${new Date(billing.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </p>
      </div>
    </div>
  `;
}

// ============================================
// AUTOMATION SERVICES
// ============================================

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Update this to your API URL

// Load automation services
async function loadAutomationServices() {
  const container = document.getElementById('automation-services-container');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE_URL}/services`);
    if (!response.ok) {
      throw new Error('Failed to load services');
    }
    const data = await response.json();
    renderAutomationServices(data.services);
  } catch (error) {
    console.error('Error loading automation services:', error);
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted);">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <p><strong>Unable to connect to automation services API</strong></p>
        <p style="font-size:14px;margin-top:8px;">Make sure the API server is running on ${API_BASE_URL}</p>
        <button class="btn primary" onclick="loadAutomationServices()" style="margin-top:16px;">Retry</button>
      </div>
    `;
  }
}

// Load automation services for overview section
async function loadAutomationServicesForOverview() {
  const servicesContainer = document.getElementById('services-container');
  if (!servicesContainer) return;

  try {
    const response = await fetch(`${API_BASE_URL}/services`);
    if (!response.ok) {
      return; // Silently fail for overview
    }
    const data = await response.json();
    if (data.services && data.services.length > 0) {
      // Add automation services section to overview
      const automationSection = document.createElement('div');
      automationSection.style.cssText = 'margin-top:32px;padding-top:32px;border-top:1px solid var(--border);';
      automationSection.innerHTML = `
        <div style="margin-bottom:16px;">
          <h3 style="margin:0 0 8px;font-size:20px;">🤖 Available Automation Services</h3>
          <p style="margin:0;color:var(--muted);font-size:14px;">Access ${data.services.length} automation services to streamline your workflows</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">
          ${data.services.slice(0, 6).map(service => `
            <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:16px;cursor:pointer;transition:all 0.2s;" 
                 onclick="document.querySelector('[data-tab=\\'automation-services\\']').click();openServiceModal('${service.id}')"
                 onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)'" 
                 onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)'">
              <div style="font-size:32px;margin-bottom:8px;">${service.icon}</div>
              <div style="font-weight:500;font-size:14px;margin-bottom:4px;">${service.name}</div>
              <div style="font-size:12px;color:var(--muted);">${service.category}</div>
            </div>
          `).join('')}
        </div>
        ${data.services.length > 6 ? `
          <div style="margin-top:16px;text-align:center;">
            <button class="btn" onclick="document.querySelector('[data-tab=\\'automation-services\\']').click()">
              View All ${data.services.length} Services →
            </button>
          </div>
        ` : ''}
      `;
      servicesContainer.appendChild(automationSection);
    }
  } catch (error) {
    // Silently fail for overview
    console.error('Error loading automation services for overview:', error);
  }
}

// Render automation services grid
function renderAutomationServices(services) {
  const container = document.getElementById('automation-services-container');
  if (!container) return;

  if (!services || services.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);">No services available.</p>';
    return;
  }

  container.innerHTML = `
    <div class="automation-services-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;">
      ${services.map(service => `
        <div class="automation-service-card" style="background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:24px;transition:all 0.2s;cursor:pointer;" 
             onclick="openServiceModal('${service.id}')" 
             onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)'">
          <div style="font-size:48px;margin-bottom:16px;">${service.icon}</div>
          <h3 style="margin:0 0 8px;font-size:20px;">${service.name}</h3>
          <p style="margin:0;color:var(--muted);font-size:14px;line-height:1.6;">${service.description}</p>
          <div style="margin-top:16px;">
            <span class="service-category" style="display:inline-block;padding:4px 12px;background:rgba(124,58,237,0.1);color:var(--accent);border-radius:12px;font-size:12px;text-transform:capitalize;">${service.category}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Open service modal
function openServiceModal(serviceId) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'service-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
  
  modal.innerHTML = `
    <div class="service-modal-content" style="background:var(--card-bg);border-radius:16px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;position:relative;">
      <button class="service-modal-close" onclick="this.closest('.service-modal').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:var(--muted);z-index:10;">✕</button>
      <div id="service-modal-body" style="padding:32px;">
        <div style="text-align:center;padding:20px;">
          <div class="spinner" style="border:3px solid var(--border);border-top:3px solid var(--accent);border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto;"></div>
          <p style="margin-top:16px;color:var(--muted);">Loading service...</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load service interface
  loadServiceInterface(serviceId, modal.querySelector('#service-modal-body'));
}

// Load service interface based on service ID
function loadServiceInterface(serviceId, container) {
  const serviceInterfaces = {
    'data-clean': renderDataCleanInterface,
    'voice-of-customer': renderVoiceOfCustomerInterface,
    'content-ops': renderContentOpsInterface,
    'help-desk': renderHelpDeskInterface,
    'reputation-review': renderReputationReviewInterface,
    'missed-call': renderMissedCallInterface,
    'speed-to-lead': renderSpeedToLeadInterface,
    'agency-toolkit': renderAgencyToolkitInterface,
    'custom-gpts': renderCustomGPTsInterface,
    'compliance-policy': renderCompliancePolicyInterface,
    'vertical-lead-gen': renderVerticalLeadGenInterface,
    'lead-followup': renderLeadFollowupInterface
  };

  const renderFunction = serviceInterfaces[serviceId];
  if (renderFunction) {
    renderFunction(container);
  } else {
    container.innerHTML = '<p>Service interface not available.</p>';
  }
}

// Service Interface Renderers
// Global file queue for tracking uploaded files
let fileQueue = [];

// Helper to get file icon based on extension
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    'csv': '📄',
    'xlsx': '📊',
    'xls': '📊',
    'json': '📋',
    'tsv': '📑',
    'txt': '📝'
  };
  return icons[ext] || '📁';
}

function renderDataCleanInterface(container) {
  container.innerHTML = `
    <h2 style="margin:0 0 24px;font-size:28px;">🧹 Data Clean Engine</h2>
    <p style="color:var(--muted);margin-bottom:24px;">Cleans, standardizes, and fixes messy data files. Supports CSV, Excel (XLSX/XLS), JSON, TSV, and CRM exports (Salesforce, HubSpot, Pipedrive). <strong>Now supports batch processing and files with millions of rows!</strong></p>
    
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:8px;padding:16px;margin-bottom:24px;">
      <h3 style="margin:0 0 12px;font-size:16px;color:var(--accent);">📋 Supported Formats & Features</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;font-size:14px;margin-bottom:12px;">
        <div>• CSV files</div>
        <div>• Excel (XLSX/XLS)</div>
        <div>• JSON files</div>
        <div>• TSV files</div>
        <div>• Salesforce exports</div>
        <div>• HubSpot exports</div>
        <div>• Pipedrive exports</div>
      </div>
      <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:6px;padding:12px;margin-top:12px;">
        <strong style="color:#22c55e;">✨ New Features:</strong>
        <ul style="margin:8px 0 0 20px;font-size:13px;">
          <li>Upload files individually or in bulk</li>
          <li>Track all files before processing</li>
          <li>Handles files with 100,000+ entries (billions supported)</li>
          <li>Multiple export formats (CSV, JSON, Excel)</li>
          <li>Column-based files for data verification</li>
        </ul>
      </div>
    </div>
    
    <form id="data-clean-form" enctype="multipart/form-data">
      <div class="form-group" style="margin-bottom:20px;">
        <label style="display:block;margin-bottom:8px;font-weight:500;">Upload Files</label>
        <div style="border:2px dashed var(--border);border-radius:8px;padding:24px;text-align:center;background:var(--bg);transition:all 0.2s;" 
             id="file-drop-zone" 
             ondrop="handleFileDrop(event)" 
             ondragover="event.preventDefault();event.currentTarget.style.borderColor='var(--accent)';" 
             ondragleave="event.currentTarget.style.borderColor='var(--border)';">
          <input type="file" id="data-file" name="files[]" accept=".csv,.xlsx,.xls,.json,.tsv" 
                 multiple style="display:none;" onchange="handleFileSelect(event)" ondblclick="this.click()">
          <div style="font-size:48px;margin-bottom:12px;">📁</div>
          <p style="margin:0 0 12px;color:var(--muted);">Drag and drop files here, or</p>
          <button type="button" class="btn" onclick="document.getElementById('data-file').click()" ondblclick="document.getElementById('data-file').click()">Browse Files</button>
          <p style="margin:8px 0 0;color:var(--muted);font-size:12px;">Double-click to browse, or select multiple files at once</p>
        </div>
      </div>
      
      <!-- File Queue Display -->
      <div id="file-queue-section" style="margin-bottom:20px;display:none;">
        <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="margin:0;font-size:18px;">📋 File Queue (<span id="queue-count">0</span> files)</h3>
            <button type="button" class="btn" onclick="clearFileQueue()" style="font-size:12px;padding:6px 12px;">Clear All</button>
          </div>
          <div id="file-queue-list" style="max-height:400px;overflow-y:auto;">
            <!-- File queue items will be inserted here -->
          </div>
        </div>
      </div>
      
      <div style="border-top:1px solid var(--border);padding-top:20px;margin-bottom:20px;">
        <p style="margin:0 0 16px;color:var(--muted);font-size:14px;">Or paste CSV content:</p>
        <textarea id="csv-text" rows="8" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;font-family:monospace;font-size:13px;" 
                  placeholder="Paste your CSV content here (alternative to file upload)..."></textarea>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px;">
        <div class="form-group">
          <label style="display:block;margin-bottom:8px;font-weight:500;">Delimiter (CSV/TSV)</label>
          <input type="text" id="delimiter" name="delimiter" value="," maxlength="1" 
                 style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;">
        </div>
        <div class="form-group">
          <label style="display:block;margin-bottom:8px;font-weight:500;">File Type (optional)</label>
          <select id="file-type" name="file_type" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);">
            <option value="">Auto-detect</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="json">JSON</option>
            <option value="tsv">TSV</option>
          </select>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="normalize-headers" name="normalize_headers" checked>
          <span>Normalize Headers</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="drop-empty-rows" name="drop_empty_rows" checked>
          <span>Drop Empty Rows</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="apply-crm-mappings" name="apply_crm_mappings" checked>
          <span>Apply CRM Mappings</span>
        </label>
      </div>
      
      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:16px;margin-bottom:20px;">
        <h3 style="margin:0 0 12px;font-size:16px;color:#3b82f6;">📥 Export Formats</h3>
        <p style="margin:0 0 12px;color:var(--muted);font-size:14px;">Select which formats you want to export (you can select multiple):</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;background:var(--card-bg);border-radius:6px;">
            <input type="checkbox" id="export-csv" name="export_formats" value="csv" checked>
            <span>📄 CSV</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;background:var(--card-bg);border-radius:6px;">
            <input type="checkbox" id="export-json" name="export_formats" value="json" checked>
            <span>📋 JSON</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;background:var(--card-bg);border-radius:6px;">
            <input type="checkbox" id="export-excel" name="export_formats" value="excel" checked>
            <span>📊 Excel</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;background:var(--card-bg);border-radius:6px;">
            <input type="checkbox" id="export-columns" name="export_formats" value="columns">
            <span>📑 Column Files</span>
          </label>
        </div>
        <p style="margin:12px 0 0;color:var(--muted);font-size:12px;">💡 Column Files: One file per column for data verification</p>
      </div>
      
      <button type="button" id="process-files-btn" class="btn primary" style="width:100%;" onclick="processFileQueue()" disabled>Clean Data (0 files queued)</button>
    </form>
    
    <div id="data-clean-result" style="margin-top:24px;display:none;"></div>
  `;
  
  // Reset file queue when interface is rendered
  fileQueue = [];
  updateFileQueueDisplay();
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    addFilesToQueue(files);
    // Reset the file input so the same file can be selected again
    event.target.value = '';
  }
}

function handleFileDrop(event) {
  event.preventDefault();
  event.currentTarget.style.borderColor = 'var(--border)';
  const files = Array.from(event.dataTransfer.files);
  if (files.length > 0) {
    addFilesToQueue(files);
  }
}

function addFilesToQueue(files) {
  // Add files to queue, avoiding duplicates by name
  const existingNames = new Set(fileQueue.map(f => f.name));
  const newFiles = files.filter(file => !existingNames.has(file.name));
  
  fileQueue.push(...newFiles);
  updateFileQueueDisplay();
}

function removeFileFromQueue(index) {
  fileQueue.splice(index, 1);
  updateFileQueueDisplay();
}

function clearFileQueue() {
  fileQueue = [];
  updateFileQueueDisplay();
}

function updateFileQueueDisplay() {
  const queueSection = document.getElementById('file-queue-section');
  const queueList = document.getElementById('file-queue-list');
  const queueCount = document.getElementById('queue-count');
  const processBtn = document.getElementById('process-files-btn');
  
  if (!queueSection || !queueList || !queueCount || !processBtn) return;
  
  if (fileQueue.length === 0) {
    queueSection.style.display = 'none';
    processBtn.disabled = true;
    processBtn.textContent = 'Clean Data (0 files queued)';
  } else {
    queueSection.style.display = 'block';
    queueCount.textContent = fileQueue.length;
    processBtn.disabled = false;
    processBtn.textContent = `Clean Data (${fileQueue.length} file${fileQueue.length > 1 ? 's' : ''} queued)`;
    
    queueList.innerHTML = fileQueue.map((file, index) => {
      // Initialize export formats for this file if not set
      if (!file.exportFormats) {
        file.exportFormats = ['csv', 'json', 'excel', 'columns'];
      }
      
      return `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="flex:1;display:flex;align-items:center;gap:12px;">
              <div style="font-size:28px;">${getFileIcon(file.name)}</div>
              <div style="flex:1;">
                <div style="font-weight:500;font-size:15px;margin-bottom:4px;">${file.name}</div>
                <div style="font-size:12px;color:var(--muted);">${formatFileSize(file.size)}</div>
              </div>
            </div>
            <button type="button" onclick="removeFileFromQueue(${index})" 
                    style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:20px;padding:0 12px;transition:color 0.2s;"
                    onmouseover="this.style.color='#ef4444'" 
                    onmouseout="this.style.color='var(--muted)'"
                    title="Remove from queue">✕</button>
          </div>
          <div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.2);border-radius:6px;padding:12px;">
            <div style="font-size:13px;font-weight:500;margin-bottom:8px;color:#3b82f6;">📥 Export Formats for this file:</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
                <input type="checkbox" ${file.exportFormats.includes('csv') ? 'checked' : ''} 
                       onchange="updateFileExportFormats(${index}, 'csv', this.checked)">
                <span>📄 CSV</span>
              </label>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
                <input type="checkbox" ${file.exportFormats.includes('json') ? 'checked' : ''} 
                       onchange="updateFileExportFormats(${index}, 'json', this.checked)">
                <span>📋 JSON</span>
              </label>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
                <input type="checkbox" ${file.exportFormats.includes('excel') ? 'checked' : ''} 
                       onchange="updateFileExportFormats(${index}, 'excel', this.checked)">
                <span>📊 Excel</span>
              </label>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
                <input type="checkbox" ${file.exportFormats.includes('columns') ? 'checked' : ''} 
                       onchange="updateFileExportFormats(${index}, 'columns', this.checked)">
                <span>📑 Columns</span>
              </label>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function updateFileExportFormats(fileIndex, format, enabled) {
  if (fileQueue[fileIndex]) {
    if (!fileQueue[fileIndex].exportFormats) {
      fileQueue[fileIndex].exportFormats = [];
    }
    if (enabled) {
      if (!fileQueue[fileIndex].exportFormats.includes(format)) {
        fileQueue[fileIndex].exportFormats.push(format);
      }
    } else {
      fileQueue[fileIndex].exportFormats = fileQueue[fileIndex].exportFormats.filter(f => f !== format);
    }
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function clearFileSelection() {
  document.getElementById('data-file').value = '';
  document.getElementById('file-list').style.display = 'none';
}

function processFileQueue() {
  const resultDiv = document.getElementById('data-clean-result');
  const button = document.getElementById('process-files-btn');
  const csvText = document.getElementById('csv-text').value;
  
  // Check if files are queued or text was provided
  if (fileQueue.length === 0 && !csvText.trim()) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;color:#ef4444;">Please add files to the queue or paste CSV content.</div>`;
    return;
  }
  
  // Validate that each file has at least one export format selected
  const filesWithoutFormats = fileQueue.filter(f => !f.exportFormats || f.exportFormats.length === 0);
  if (filesWithoutFormats.length > 0) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;color:#ef4444;">Please select at least one export format for each file.</div>`;
    return;
  }
  
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = `Processing ${fileQueue.length} file${fileQueue.length > 1 ? 's' : ''}...`;
  
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `
    <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:16px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:24px;height:24px;border:3px solid rgba(59,130,246,0.3);border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <div>
          <strong style="color:#3b82f6;">Processing ${fileQueue.length} file${fileQueue.length > 1 ? 's' : ''}...</strong>
          <p style="margin:4px 0 0;color:var(--muted);font-size:14px;">Please wait while we clean your data</p>
        </div>
      </div>
    </div>
  `;
  
  // Process files individually with their specific export formats
  if (fileQueue.length > 0) {
    processFilesIndividually(fileQueue, resultDiv, button, originalText);
  } else {
    // Text mode (backward compatibility)
    const formData = new FormData();
    formData.append('csv_text', csvText);
    formData.append('delimiter', document.getElementById('delimiter').value || ',');
    formData.append('normalize_headers', document.getElementById('normalize-headers').checked);
    formData.append('drop_empty_rows', document.getElementById('drop-empty-rows').checked);
    formData.append('export_formats', 'csv,json,excel,columns'); // Default for text input
    
    fetch(`${API_BASE_URL}/services/data-clean`, {
      method: 'POST',
      body: JSON.stringify({
        csv_text: csvText,
        delimiter: document.getElementById('delimiter').value || ',',
        normalize_headers: document.getElementById('normalize-headers').checked,
        drop_empty_rows: document.getElementById('drop-empty-rows').checked
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        displaySingleFileResult(data, resultDiv, ['csv', 'json', 'excel', 'columns']);
      } else {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;color:#ef4444;">Error: ${data.error}</div>`;
      }
    })
    .catch(error => {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;color:#ef4444;">Error: ${error.message}</div>`;
    })
    .finally(() => {
      button.disabled = fileQueue.length === 0;
      button.textContent = fileQueue.length > 0 ? `Clean Data (${fileQueue.length} file${fileQueue.length > 1 ? 's' : ''} queued)` : 'Clean Data (0 files queued)';
    });
  }
}

function processFilesIndividually(files, resultDiv, button, originalText) {
  const results = [];
  let processedCount = 0;
  
  files.forEach((file, index) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('delimiter', document.getElementById('delimiter').value || ',');
    formData.append('normalize_headers', document.getElementById('normalize-headers').checked);
    formData.append('drop_empty_rows', document.getElementById('drop-empty-rows').checked);
    formData.append('apply_crm_mappings', document.getElementById('apply-crm-mappings').checked);
    formData.append('export_formats', file.exportFormats.join(','));
    const fileType = document.getElementById('file-type').value;
    if (fileType) {
      formData.append('file_type', fileType);
    }
    
    fetch(`${API_BASE_URL}/services/data-clean`, {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      processedCount++;
      results.push({
        filename: file.name,
        success: data.success,
        data: data,
        exportFormats: file.exportFormats
      });
      
      if (processedCount === files.length) {
        displayProcessingSummary(results, resultDiv, button, originalText);
        fileQueue = [];
        updateFileQueueDisplay();
      }
    })
    .catch(error => {
      processedCount++;
      results.push({
        filename: file.name,
        success: false,
        error: error.message,
        exportFormats: file.exportFormats
      });
      
      if (processedCount === files.length) {
        displayProcessingSummary(results, resultDiv, button, originalText);
        fileQueue = [];
        updateFileQueueDisplay();
      }
    });
  });
}

function displayProcessingSummary(results, resultDiv, button, originalText) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  let html = `
    <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:20px;margin-bottom:20px;">
      <h3 style="margin:0 0 16px;color:#22c55e;font-size:20px;">📊 Processing Summary</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;font-size:14px;">
        <div>
          <strong style="color:#22c55e;">✅ Successful:</strong> ${successful.length} file${successful.length !== 1 ? 's' : ''}
        </div>
        ${failed.length > 0 ? `<div><strong style="color:#ef4444;">❌ Failed:</strong> ${failed.length} file${failed.length !== 1 ? 's' : ''}</div>` : ''}
        <div>
          <strong>📁 Total Processed:</strong> ${results.length} file${results.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  `;
  
  // Display results for each file
  results.forEach((result, index) => {
    if (result.success && result.data) {
      html += `
        <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
            <div>
              <h4 style="margin:0 0 8px;font-size:18px;">${getFileIcon(result.filename)} ${result.filename}</h4>
              <div style="font-size:13px;color:var(--muted);">
                <strong>Rows:</strong> ${result.data.report.rows_in} → ${result.data.report.rows_out} | 
                <strong>Duplicates Removed:</strong> ${result.data.report.duplicates_removed || 0} |
                <strong>Irrelevant Removed:</strong> ${result.data.report.irrelevant_rows_removed || 0}
              </div>
            </div>
            <span style="background:rgba(34,197,94,0.1);color:#22c55e;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500;">✅ Success</span>
          </div>
          
          ${buildFileExportSection(result.data, result.exportFormats, result.filename)}
          ${result.data.column_files ? buildColumnFilesSection(result.data.column_files, result.filename.replace(/\.[^/.]+$/, '')) : ''}
        </div>
      `;
    } else {
      html += `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:20px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div>
              <h4 style="margin:0 0 8px;font-size:18px;color:#ef4444;">${getFileIcon(result.filename)} ${result.filename}</h4>
              <p style="margin:0;color:#ef4444;">Error: ${result.error || 'Unknown error'}</p>
            </div>
            <span style="background:rgba(239,68,68,0.1);color:#ef4444;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500;">❌ Failed</span>
          </div>
        </div>
      `;
    }
  });
  
  resultDiv.innerHTML = html;
  button.disabled = fileQueue.length === 0;
  button.textContent = fileQueue.length > 0 ? `Clean Data (${fileQueue.length} file${fileQueue.length > 1 ? 's' : ''} queued)` : 'Clean Data (0 files queued)';
}

function buildFileExportSection(data, exportFormats, filename) {
  const outputs = data.outputs || {};
  const columnFiles = data.column_files || {};
  const baseFilename = filename.replace(/\.[^/.]+$/, '');
  
  let html = `
    <div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:16px;">
      <h5 style="margin:0 0 12px;font-size:16px;color:#3b82f6;">📥 Download Exports</h5>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:${exportFormats.includes('columns') && Object.keys(columnFiles).length > 0 ? '16px' : '0'};">
  `;
  
  // Master file exports
  if (exportFormats.includes('csv') && outputs.master_cleanse_csv) {
    html += `<button class="btn primary" onclick="downloadFile('${outputs.master_cleanse_csv.replace(/'/g, "\\'")}', '${baseFilename}_master_cleaned.csv', 'text/csv')" style="font-size:13px;">📄 Master CSV</button>`;
  }
  if (exportFormats.includes('json') && outputs.master_cleanse_json) {
    html += `<button class="btn primary" onclick="downloadFile('${outputs.master_cleanse_json.replace(/'/g, "\\'").replace(/\n/g, "\\n")}', '${baseFilename}_master_cleaned.json', 'application/json')" style="font-size:13px;">📋 Master JSON</button>`;
  }
  if (exportFormats.includes('excel') && outputs.master_cleanse_excel) {
    html += `<button class="btn primary" onclick="downloadExcelFromBase64('${outputs.master_cleanse_excel}', '${baseFilename}_master_cleaned.xlsx')" style="font-size:13px;">📊 Master Excel</button>`;
  }
  
  html += `</div>`;
  
  // Column-based files (always show - core feature for data verification)
  if (Object.keys(columnFiles).length > 0) {
    html += `
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(59,130,246,0.2);">
        <h6 style="margin:0 0 12px;font-size:14px;color:#3b82f6;">📑 Column-Based Files (One per column)</h6>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
    `;
    
    for (const [colName, colData] of Object.entries(columnFiles)) {
      const safeColName = colName.replace(/[^a-zA-Z0-9]/g, '_');
      html += `
        <div style="border:1px solid var(--border);border-radius:6px;padding:10px;background:var(--bg);">
          <div style="font-weight:500;font-size:13px;margin-bottom:8px;color:var(--text);">${colName}</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${colData.csv ? `<button class="btn" onclick="downloadFile('${colData.csv.replace(/'/g, "\\'")}', '${baseFilename}_column_${safeColName}.csv', 'text/csv')" style="font-size:11px;padding:4px 8px;">CSV</button>` : ''}
            ${colData.json ? `<button class="btn" onclick="downloadFile('${colData.json.replace(/'/g, "\\'").replace(/\n/g, "\\n")}', '${baseFilename}_column_${safeColName}.json', 'application/json')" style="font-size:11px;padding:4px 8px;">JSON</button>` : ''}
            ${colData.excel ? `<button class="btn" onclick="downloadExcelFromBase64('${colData.excel}', '${baseFilename}_column_${safeColName}.xlsx')" style="font-size:11px;padding:4px 8px;">Excel</button>` : ''}
          </div>
        </div>
      `;
    }
    
    html += `</div></div>`;
  }
  
  html += `</div>`;
  
  return html;
}

function displaySingleFileResult(data, resultDiv, exportFormats) {
  resultDiv.style.display = 'block';
  const crmInfo = data.report.crm_detected ? 
    `<div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:8px;padding:12px;margin-bottom:12px;">
      <strong>CRM Detected:</strong> ${data.report.crm_detected.charAt(0).toUpperCase() + data.report.crm_detected.slice(1)}
    </div>` : '';
  
  const fixesInfo = Object.entries(data.report.fixes)
    .filter(([key, value]) => value > 0)
    .map(([key, value]) => `<div><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${value}</div>`)
    .join('');
  
  const duplicatesRemoved = data.report.duplicates_removed || 0;
  const irrelevantRemoved = data.report.irrelevant_rows_removed || 0;
  const cleanupInfo = (duplicatesRemoved > 0 || irrelevantRemoved > 0) ? `
    <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:12px;margin-top:12px;">
      <strong style="color:#3b82f6;">Data Cleanup:</strong>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px;font-size:13px;">
        ${duplicatesRemoved > 0 ? `<div><strong>Duplicates Removed:</strong> ${duplicatesRemoved}</div>` : ''}
        ${irrelevantRemoved > 0 ? `<div><strong>Irrelevant Rows Removed:</strong> ${irrelevantRemoved}</div>` : ''}
      </div>
    </div>
  ` : '';
  
  // Build export buttons based on available outputs and selected formats
  const outputs = data.outputs || {};
  const exportButtons = buildExportButtons(outputs, data.report.file_type, exportFormats);
  
  // Column files section (always show - core feature)
  const columnFilesSection = data.column_files ? 
    buildColumnFilesSection(data.column_files, 'cleaned_data') : '';
  
  resultDiv.innerHTML = `
    <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:16px;margin-bottom:16px;">
      <h3 style="margin:0 0 12px;color:#22c55e;">✅ Data Cleaned Successfully</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;font-size:14px;margin-bottom:12px;">
        <div><strong>Rows:</strong> ${data.report.rows_in} → ${data.report.rows_out}</div>
        <div><strong>Columns:</strong> ${data.report.columns_in} → ${data.report.columns_out}</div>
        <div><strong>File Type:</strong> ${data.report.file_type.toUpperCase()}</div>
        <div><strong>Processing Time:</strong> ${new Date(data.report.finished_at).getTime() - new Date(data.report.started_at).getTime()}ms</div>
      </div>
      ${crmInfo}
      ${cleanupInfo}
      ${fixesInfo ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(34,197,94,0.2);"><strong>Fixes Applied:</strong><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px;font-size:13px;">${fixesInfo}</div></div>` : ''}
    </div>
    
    <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px;">
      <h3 style="margin:0 0 16px;font-size:18px;">📥 Download Exports</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
        ${exportButtons}
      </div>
    </div>
    
    ${columnFilesSection}
    
    ${outputs.master_cleanse_csv ? `
    <div style="margin-bottom:16px;">
      <label style="display:block;margin-bottom:8px;font-weight:500;">Preview (CSV):</label>
      <textarea readonly rows="8" id="cleaned-csv-output" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;font-family:monospace;background:var(--bg);font-size:12px;">${outputs.master_cleanse_csv.substring(0, 2000)}${outputs.master_cleanse_csv.length > 2000 ? '...' : ''}</textarea>
    </div>
    ` : ''}
  `;
}

function buildExportButtons(outputs, originalFileType, exportFormats) {
  const buttons = [];
  
  if (exportFormats.includes('csv') && outputs.master_cleanse_csv) {
    buttons.push(`
      <button class="btn primary" onclick="downloadFile('${outputs.master_cleanse_csv.replace(/'/g, "\\'")}', 'cleaned_data.csv', 'text/csv')" style="width:100%;">
        📄 Download CSV
      </button>
    `);
  }
  
  if (exportFormats.includes('json') && outputs.master_cleanse_json) {
    buttons.push(`
      <button class="btn primary" onclick="downloadFile('${outputs.master_cleanse_json.replace(/'/g, "\\'").replace(/\n/g, "\\n")}', 'cleaned_data.json', 'application/json')" style="width:100%;">
        📋 Download JSON
      </button>
    `);
  }
  
  if (exportFormats.includes('excel') && outputs.master_cleanse_excel) {
    buttons.push(`
      <button class="btn primary" onclick="downloadExcelFromBase64('${outputs.master_cleanse_excel}', 'cleaned_data.xlsx')" style="width:100%;">
        📊 Download Excel
      </button>
    `);
  }
  
  return buttons.join('');
}

function buildColumnFilesSection(columnFiles, baseFilename = 'cleaned_data') {
  let html = `
    <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px;">
      <h3 style="margin:0 0 12px;font-size:18px;">📑 Column-Based Files</h3>
      <p style="margin:0 0 16px;color:var(--muted);font-size:14px;">One file per column for data verification - ensures no accidental deletions:</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
  `;
  
  for (const [colName, colData] of Object.entries(columnFiles)) {
    const safeColName = colName.replace(/[^a-zA-Z0-9]/g, '_');
    html += `
      <div style="border:1px solid var(--border);border-radius:6px;padding:10px;background:var(--bg);">
        <div style="font-weight:500;font-size:13px;margin-bottom:8px;color:var(--text);">${colName}</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${colData.csv ? `<button class="btn" onclick="downloadFile('${colData.csv.replace(/'/g, "\\'")}', '${baseFilename}_column_${safeColName}.csv', 'text/csv')" style="font-size:11px;padding:4px 8px;">CSV</button>` : ''}
          ${colData.json ? `<button class="btn" onclick="downloadFile('${colData.json.replace(/'/g, "\\'").replace(/\n/g, "\\n")}', '${baseFilename}_column_${safeColName}.json', 'application/json')" style="font-size:11px;padding:4px 8px;">JSON</button>` : ''}
          ${colData.excel ? `<button class="btn" onclick="downloadExcelFromBase64('${colData.excel}', '${baseFilename}_column_${safeColName}.xlsx')" style="font-size:11px;padding:4px 8px;">Excel</button>` : ''}
        </div>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

function displayBatchResults(results, resultDiv, button, originalText) {
  resultDiv.style.display = 'block';
  let html = `
    <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:16px;margin-bottom:16px;">
      <h3 style="margin:0 0 12px;color:#22c55e;">✅ Batch Processing Complete</h3>
      <p style="margin:0;font-size:14px;">Processed ${results.length} file(s)</p>
    </div>
  `;
  
  results.forEach((result, index) => {
    if (result.success) {
      html += `
        <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px;">
          <h4 style="margin:0 0 12px;">${result.filename}</h4>
          <div style="font-size:14px;margin-bottom:12px;">
            <strong>Rows:</strong> ${result.report.rows_in} → ${result.report.rows_out} | 
            <strong>Duplicates Removed:</strong> ${result.report.duplicates_removed || 0}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${result.outputs.master_cleanse_csv ? `<button class="btn" onclick="downloadFile('${result.outputs.master_cleanse_csv.replace(/'/g, "\\'")}', '${result.filename}_cleaned.csv', 'text/csv')">CSV</button>` : ''}
            ${result.outputs.master_cleanse_json ? `<button class="btn" onclick="downloadFile('${result.outputs.master_cleanse_json.replace(/'/g, "\\'").replace(/\n/g, "\\n")}', '${result.filename}_cleaned.json', 'application/json')">JSON</button>` : ''}
            ${result.outputs.master_cleanse_excel ? `<button class="btn" onclick="downloadExcelFromBase64('${result.outputs.master_cleanse_excel}', '${result.filename}_cleaned.xlsx')">Excel</button>` : ''}
          </div>
        </div>
      `;
    } else {
      html += `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;margin-bottom:16px;">
          <h4 style="margin:0 0 8px;color:#ef4444;">${result.filename}</h4>
          <p style="margin:0;color:#ef4444;">Error: ${result.error}</p>
        </div>
      `;
    }
  });
  
  resultDiv.innerHTML = html;
  button.disabled = false;
  button.textContent = originalText;
}

function downloadFile(content, filename, mimeType) {
  try {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    const dataUri = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = filename;
    a.click();
  }
}

function downloadExcelFromBase64(base64Data, filename) {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel download error:', error);
    alert('Error downloading Excel file. Please try again.');
  }
}

function downloadCleanedFile(originalFileType, content) {
  downloadFile(content, `cleaned_data.${originalFileType === 'json' ? 'json' : 'csv'}`, originalFileType === 'json' ? 'application/json' : 'text/csv');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textarea);
  });
}

function downloadCSV(content, filename) {
  try {
    // Ensure content is a string
    const contentStr = typeof content === 'string' ? content : String(content);
    
    // Create blob with proper encoding
    const blob = new Blob([contentStr], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'cleaned_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    // Fallback: create a data URL
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content);
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = filename || 'cleaned_data.csv';
    a.click();
  }
}

// Add spinner animation
const style = document.createElement('style');
style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
document.head.appendChild(style);

// Simplified interfaces for other services (can be expanded later)
function renderVoiceOfCustomerInterface(container) {
  container.innerHTML = `
    <h2 style="margin:0 0 24px;font-size:28px;">🎤 Voice of Customer</h2>
    <p style="color:var(--muted);margin-bottom:24px;">Analyze customer call transcripts to extract insights, sentiment, and summaries.</p>
    <form onsubmit="handleVoiceOfCustomer(event)">
      <div class="form-group" style="margin-bottom:20px;">
        <label style="display:block;margin-bottom:8px;font-weight:500;">Transcript Text</label>
        <textarea id="transcript-text" rows="10" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;" required></textarea>
      </div>
      <button type="submit" class="btn primary" style="width:100%;">Analyze Transcript</button>
    </form>
    <div id="voc-result" style="margin-top:24px;"></div>
  `;
}

function handleVoiceOfCustomer(event) {
  event.preventDefault();
  const resultDiv = document.getElementById('voc-result');
  const button = event.target.querySelector('button[type="submit"]');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Analyzing...';
  
  fetch(`${API_BASE_URL}/services/voice-of-customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript_text: document.getElementById('transcript-text').value,
      max_summary_sentences: 6
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      resultDiv.innerHTML = `
        <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:20px;margin-top:16px;">
          <h3 style="margin:0 0 16px;">Summary</h3>
          <p style="margin-bottom:16px;">${data.result.summary}</p>
          <h4 style="margin:16px 0 8px;">Sentiment</h4>
          <p>Label: <strong>${data.result.sentiment.label}</strong> (Score: ${data.result.sentiment.score})</p>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `<div style="color:#ef4444;margin-top:16px;">Error: ${data.error}</div>`;
    }
  })
  .catch(error => {
    resultDiv.innerHTML = `<div style="color:#ef4444;margin-top:16px;">Error: ${error.message}</div>`;
  })
  .finally(() => {
    button.disabled = false;
    button.textContent = originalText;
  });
}

// Placeholder interfaces for other services
const renderContentOpsInterface = (c) => c.innerHTML = '<h2>✍️ AI Content Operations</h2><p>Service interface coming soon...</p>';
const renderHelpDeskInterface = (c) => c.innerHTML = '<h2>🆘 AI Help Desk</h2><p>Service interface coming soon...</p>';
const renderReputationReviewInterface = (c) => c.innerHTML = '<h2>⭐ Reputation Review Automation</h2><p>Service interface coming soon...</p>';
const renderMissedCallInterface = (c) => c.innerHTML = '<h2>📞 Missed Call Automation</h2><p>Service interface coming soon...</p>';
const renderSpeedToLeadInterface = (c) => c.innerHTML = '<h2>⚡ Speed to Lead Automation</h2><p>Service interface coming soon...</p>';
const renderAgencyToolkitInterface = (c) => c.innerHTML = '<h2>🛠️ AI Automation Agency Toolkit</h2><p>Service interface coming soon...</p>';
const renderCustomGPTsInterface = (c) => c.innerHTML = '<h2>🤖 Custom GPTs for Teams</h2><p>Service interface coming soon...</p>';
const renderCompliancePolicyInterface = (c) => c.innerHTML = '<h2>📋 Compliance Policy Generator</h2><p>Service interface coming soon...</p>';
const renderVerticalLeadGenInterface = (c) => c.innerHTML = '<h2>🎯 Vertical Lead Generation</h2><p>Service interface coming soon...</p>';
const renderLeadFollowupInterface = (c) => c.innerHTML = '<h2>💬 AI Lead Follow-up & Nurture</h2><p>Service interface coming soon...</p>';

// Initialize automation services when dashboard loads
function initAutomationServices() {
  const automationTab = document.getElementById('tab-automation-services');
  if (automationTab) {
    // Load services when tab is clicked
    const tabButton = document.querySelector('[data-tab="automation-services"]');
    if (tabButton) {
      tabButton.addEventListener('click', () => {
        setTimeout(loadAutomationServices, 100);
      });
    }
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    if (window.location.pathname.includes('/dashboard/')) {
      initDashboard();
      initAutomationServices();
    }
  });
} else {
  updateNavigation();
  if (window.location.pathname.includes('/dashboard/')) {
    initDashboard();
    initAutomationServices();
  }
}
