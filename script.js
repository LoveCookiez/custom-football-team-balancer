let allPlayers = []; 
let selectedPlayers = [];
let randomPlayers = [];
let fixMeTotalPlayersToday = 0;

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
                <label>Portar?
                    <select name="playerIsGK${i}">
                        <option value="False">Nu</option>
                        <option value="True">Da</option>
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
        const playerIsGK = form[`playerIsGK${i}`].value;
        
        let rating;
        switch (playerSkill) {
            case 'very good': rating = 85; break;
            case 'good': rating = 75; break;
            case 'moderate': rating = 65; break;
            case 'weak': rating = 55; break;
            default: rating = 50; // Default case, should not happen
        }
        let isGKOnly;
        switch (playerSkill) {
            case 'True': isGKOnly = true; break;
            case 'False': isGKOnly = true; break;
            default: isGKOnly = false; // Default case, should not happen
        }

        randomPlayers.push({ name: playerName, rating: rating, gkOnly: isGKOnly });
    }

    showStep3();
}

function showStep2() {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
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
    fetchCSVData('players.csv', parseAndDisplayPlayers);
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step4').style.display = 'block';
}

function showStep5() {
    balanceTeams();
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step5').style.display = 'block';
}

// Fetches CSV data from the server
function fetchCSVData(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'custom-football-team-balancer' + url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    };
    xhr.send();
}

function parseAndDisplayPlayers(csvData) {
    const lines = csvData.split('\n');
    document.getElementById('players').innerHTML = '';
    allPlayers = [];

    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        if (data.length >= 3) {
            const player = {
                name: data[0],
                rating: parseInt(data[1], 10),
                gkOnly: data[2].trim() === 'True',
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
    playerCard.innerHTML = `Name: ${player.name}, Rating: ${player.rating}, GK Only: ${player.gkOnly ? 'Yes' : 'No'}`;
    playerCard.innerHTML = player.name
    playerCard.addEventListener('click', function() {
            player.selected = !player.selected; // Toggle the selected state
            this.classList.toggle('selected');
            updateSelectedCount();

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

    // Separate GK_Only players and outfield players
    let gkPlayers = playersToday.filter(player => player.gkOnly);
    let outfieldPlayers = playersToday.filter(player => !player.gkOnly);

    // Check if the number of GKs matches the number of teams
    if (gkPlayers.length < teamsCount) {
        // If not enough GKs, select the lowest-rated outfield players to act as GKs
        outfieldPlayers.sort((a, b) => a.rating - b.rating); // Sort by rating ascending
        let neededGKs = teamsCount - gkPlayers.length;
        let substituteGKs = outfieldPlayers.splice(0, neededGKs);

        // Add substitute GKs to the GKs array
        gkPlayers = gkPlayers.concat(substituteGKs);
    }

    // Distribute GKs across teams
    gkPlayers.forEach((player, index) => {
        teams[index % teamsCount].players.push(player);
        teams[index % teamsCount].totalRating += player.rating;
    });

    // Sort outfield players by rating descending for distribution
    outfieldPlayers.sort((a, b) => b.rating - a.rating);

    outfieldPlayers.forEach(player => {
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
            // playerItem.textContent = `${player.name} - Rating: ${player.rating}${player.gkOnly ? ' (GK)' : ''}`;
            playerItem.textContent = `${player.name}`;
            playerList.appendChild(playerItem);
        });
        teamEl.appendChild(playerList);

        teamsContainer.appendChild(teamEl);
    });
}
