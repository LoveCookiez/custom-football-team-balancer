let allPlayers = []; 
let selectedPlayers = [];
let randomPlayers = [];
let fixMeTotalPlayersToday = 0;
let randomPlayersCount = 0;

function showRandomPlayersInput() {
    document.getElementById('randomPlayersQuestion').style.display = 'none';
    document.getElementById('randomPlayersInput').style.display = 'block';
}

function setRandomPlayersCount() {
    randomPlayersCount = parseInt(document.getElementById('randomPlayersCountInput').value, 10);
    if (isNaN(randomPlayersCount) || randomPlayersCount < 0) {
        alert('Please enter a valid number of random players.');
        return;
    }
    prepareRandomPlayersDetailsForm(randomPlayersCount);
}

function prepareRandomPlayersDetailsForm(count) {
    const form = document.getElementById('randomPlayersForm');
    form.innerHTML = ''; // Clear previous inputs if any

    for (let i = 0; i < count; i++) {
        const playerInput = document.createElement('div');
        playerInput.innerHTML = `
            <div>
                <label>Player ${i + 1} Name: <input type="text" required name="playerName${i}"></label>
            </div>
            <div>
                <label>Skill Level:
                    <select name="playerSkill${i}">
                        <option value="very good">Talent</option>
                        <option value="good">Joaca bine</option>
                        <option value="moderate">Umplutura</option>
                        <option value="weak">Slaban</option>
                    </select>
                </label>
            </div>
        `;
        form.appendChild(playerInput);
    }

    // Show the details form
    document.getElementById('randomPlayersInput').style.display = 'none';
    document.getElementById('randomPlayersDetails').style.display = 'block';
}

function collectRandomPlayersDetails() {
    const form = document.getElementById('randomPlayersForm');
    randomPlayers = [];

    for (let i = 0; i < randomPlayersCount; i++) {
        const playerName = form[`playerName${i}`].value;
        const playerSkill = form[`playerSkill${i}`].value;
        
        let rating;
        switch (playerSkill) {
            case 'very good': rating = 85; break;
            case 'good': rating = 75; break;
            case 'moderate': rating = 65; break;
            case 'weak': rating = 55; break;
            default: rating = 50; // Default case, should not happen
        }

        randomPlayers.push({ name: playerName, rating: rating});
    }

    showStep3();
}

function showStep2() { 
    const availablePlayersInput = document.getElementById('availablePlayersInput');
    if (availablePlayersInput.checkValidity()) {
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
    } else {
        availablePlayersInput.reportValidity();
    }
}

function showStep3() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
}

function showStep4() {
    const availablePlayersCount = parseInt(document.getElementById('availablePlayersInput').value, 10);
    fixMeTotalPlayersToday = availablePlayersCount
    if (!availablePlayersCount || availablePlayersCount <= 0) {
        alert('Introdu un numar valid de jucatori.');
        return;
    }
    const teamsInput = document.getElementById('teamsInput');
    if (teamsInput.checkValidity()) {
        fetchCSVData(parseAndDisplayPlayers);
        document.getElementById('step3').style.display = 'none';
        document.getElementById('step4').style.display = 'block';
    } else {
      teamsInput.reportValidity();
    }
}

function showStep5() {
    balanceTeams();
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step5').style.display = 'block';
}

// Fetches CSV data from the server
function fetchCSVData(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200 ) {
            callback(xhr.responseText);
        }
    };
    console.log("caca")
    xhr.send();
}

function fetchCSVData(callback) {
    fetch('players.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => callback(data))
        .catch(error => console.error('There has been a problem with your fetch operation:', error));
}

function parseAndDisplayPlayers(csvData) {
    const lines = csvData.split('\n');
    document.getElementById('players').innerHTML = '';
    allPlayers = [];

    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        if (data.length >= 2) {
            const player = {
                name: data[0],
                rating: parseInt(data[1], 10),
                selected: false
            };
            allPlayers.push(player);
            addPlayerCard(player);
        }
    }
    updateSelectedCount();
}

function addPlayerCard(player) {
    const playerCard = document.createElement('div');
    playerCard.classList.add('player-card');
    if (player.selected) {  
        playerCard.classList.add('selected');
    }
    playerCard.innerHTML = `Name: ${player.name}, Rating: ${player.rating}`;
    playerCard.innerHTML = player.name
    playerCard.addEventListener('click', function() {
        const totalSelected = selectedPlayers.length + randomPlayers.length;
        // Check if adding this player would exceed the total players for today
        if (player.selected || totalSelected < fixMeTotalPlayersToday) {
            player.selected = !player.selected; // Toggle the selected state
            this.classList.toggle('selected');
            updateSelectedCount();
        } else {
            // Alert the user that they cannot select more players
            alert("Nu poti selecta mai multi jucatori decat numarul total stabilit pentru azi.");
        }
            // player.selected = !player.selected; // Toggle the selected state
            // this.classList.toggle('selected');
            // updateSelectedCount();

    });
    document.getElementById('players').appendChild(playerCard);
}

function updateSelectedCount() {
    selectedPlayers = allPlayers.filter(player => player.selected);
    document.getElementById('selectedCount').innerText = `Selectati: ${selectedPlayers.length} + ${randomPlayers.length} Randomi`;
}

function balanceTeams() {
    const teamsCount = parseInt(document.getElementById('teamsInput').value, 10);
    if (isNaN(teamsCount) || teamsCount <= 0) {
        alert('Introdu un numar valid de echipe.');
        return;
    }

    let playersToday = selectedPlayers.concat(randomPlayers);

    // Prepare the teams array
    let teams = Array.from({ length: teamsCount }, () => ({ players: [], totalRating: 0 }));

    // Sort outfield players by rating descending for distribution
    playersToday.sort((a, b) => b.rating - a.rating);

    playersToday.forEach(player => {
        // Find the team with the lowest total rating
        let team = teams.reduce((prev, current) => (prev.totalRating < current.totalRating) ? prev : current);
        team.players.push(player);
        team.totalRating += player.rating;
    });

    displayTeams(teams);
}

function filterPlayers() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const filteredPlayers = allPlayers.filter(player =>
        player.name.toLowerCase().includes(searchQuery)
    );
    displayPlayers(filteredPlayers);
}

function displayPlayers(players) {
    const playersContainer = document.getElementById('players');
    playersContainer.innerHTML = '';
    players.forEach(player => {
        addPlayerCard(player);
    });
}

function displayTeams(teams) {
    const teamsContainer = document.getElementById('teamsResult');
    teamsContainer.innerHTML = '';

    teams.forEach((team, index) => {
        const teamEl = document.createElement('div');
        teamEl.className = 'team';
        
        // Create a header for the team
        const header = document.createElement('h3');
        header.textContent = `Echipa ${index + 1} (Total Rating: ${team.totalRating})`;
        teamEl.appendChild(header);
        
        // List each player in the team
        const playerList = document.createElement('ul');
        team.players.forEach(player => {
            const playerItem = document.createElement('li');
            playerItem.textContent = `${player.name}`;
            playerList.appendChild(playerItem);
        });
        teamEl.appendChild(playerList);

        teamsContainer.appendChild(teamEl);
    });
}

