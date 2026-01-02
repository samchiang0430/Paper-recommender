// Fetch recommendations from the model and display them
async function fetchRecommendedPapers() {
  try {
    const response = await fetch("http://localhost:5000/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        clarificationAnswers: JSON.parse(localStorage.getItem("clarificationAnswers")) || []
      })
    });
    const data = await response.json();
    displayPapers(data.recommended);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    const paperList = document.getElementById("paper-list");
    paperList.innerHTML = "<p>Failed to load papers. Please try again later.</p>";
  }
}

function displayPapers(papers) {
  const paperList = document.getElementById("paper-list");
  paperList.innerHTML = "";

  // Show the paper data in the console
  console.log("Displaying papers:", papers);  
  
  if (!papers || papers.length === 0) {
    paperList.innerHTML = "<p>No papers found.</p>";
    return;
  }

  papers.forEach((paper) => {
    const div = document.createElement("div");
    div.classList.add("paper-card");

    // Display authors
    const authorsText = Array.isArray(paper.authors)
      ? paper.authors.join(", ")
      : paper.authors;

    div.innerHTML = `<h1>${paper.title}</h1><p><strong>Authors:</strong> ${authorsText}</p><p><strong>Paper ID:</strong> ${paper.paperId}</p>`;

    div.addEventListener("click", () => {

      // Store the paper data in localStorage for the reader page
      localStorage.setItem("selectedPaper", JSON.stringify(paper));

      // Redirect to reader page
      window.location.href = "../reader/reader.html";
    });

    paperList.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", fetchRecommendedPapers);
