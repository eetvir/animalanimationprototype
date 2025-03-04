<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import axios from 'axios';

  // Image paths for mouth animation
  let mouthClosedImage = 'kissa.png';
  let mouthOpenImage = 'kissaauki.png';

  // Current image for mouth animation
  let currentImage = writable(mouthClosedImage);

  // Variables for audio context and animation
  let audioContext: AudioContext;
  let analyser: AnalyserNode;
  let dataArray: Uint8Array;
  let animationFrameId: number;

  // Audio element
  let audioElement: HTMLAudioElement;
  let audioFilePath = 'puhe.wav'; // Path to the generated audio file

  // Store for current text
  let textToSpeech = 'Hello, this is a test of the text to speech functionality!'; // Default text to speak
  let selectedVoice = 'af_bella'; // Default voice

  // Store for the current TTS file
  let currentTTSFile: string | null = null;

  // Store for the list of available voices
  let voices: string[] = [];

  // Function to fetch voices from the API
  async function fetchVoices() {
    try {
      const response = await axios.get('http://localhost:8880/v1/audio/voices');
      voices = response.data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  }

  // Function to generate speech and save as 'puhe.wav'
  async function generateSpeech() {
    try {
      const response = await axios.post('http://localhost:8880/v1/audio/speech', {
        model: 'kokoro',
        input: textToSpeech,
        voice: selectedVoice,
        response_format: 'mp3',
        speed: 1.0
      }, { responseType: 'arraybuffer' });

      // Create a Blob and save it as 'puhe.wav'
      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create an Audio object with the newly generated audio URL
      audioElement = new Audio(audioUrl);
      currentTTSFile = audioUrl;  // Store the generated TTS file URL
    } catch (error) {
      console.error('Error generating speech:', error);
    }
  }

  // Initialize AudioContext and AnalyserNode
  function initAudio() {
    if (!audioContext) {
      if (typeof AudioContext !== 'undefined') {
        audioContext = new AudioContext();
      } else if (typeof window !== 'undefined' && (window as any).webkitAudioContext) {
        audioContext = new (window as any).webkitAudioContext();
      } else {
        console.error('Web Audio API is not supported in this browser.');
        return;
      }
    }

    // Create a media element source for the audio element
    let source = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  // Animate the mouth based on audio data
  function animateMouth() {
    animationFrameId = requestAnimationFrame(animateMouth);
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i] - 128);
    }
    let average = sum / dataArray.length;

    // If volume exceeds a threshold, set mouth to open, otherwise closed
    if (average > 5) {
      currentImage.set(mouthOpenImage);
    } else {
      currentImage.set(mouthClosedImage);
    }
  }

  // Start the animation and audio playback
  async function startAnimation() {
    // If the TTS file hasn't been generated yet, generate it
    if (!currentTTSFile || textToSpeech !== currentTTSFile) {
      await generateSpeech();
    }

    if (!audioElement) {
      console.error("Audio element is not initialized.");
      return;
    }

    // Reset audio playback and start
    audioElement.currentTime = 0;
    initAudio();
    audioElement.play();
    animateMouth();

    // When the audio ends, stop the animation and close the mouth
    audioElement.onended = () => {
      cancelAnimationFrame(animationFrameId);
      currentImage.set(mouthClosedImage);
    };
  }

  // Stop the animation and audio
  function stopAnimation() {
    if (audioElement) {
      audioElement.pause();
      cancelAnimationFrame(animationFrameId);
      currentImage.set(mouthClosedImage); // Reset the mouth image
    }
  }

  // Handle text input for speech generation
  function handleTextInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    textToSpeech = target.value;
    currentTTSFile = null; // Reset current TTS file when text changes
  }

  // Handle voice selection
  function handleVoiceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedVoice = target.value;
    currentTTSFile = null; // Reset current TTS file when voice changes
  }

// Function to format voice name as "Name (Language)"
function formatVoice(voice: string) {
  const languageMap: Record<string, string> = {
    'af': 'American English',
    'am': 'American English',
    'bf': 'British English',
    'bm': 'British English',
    'zf': 'Mandarin Chinese',
    'zm': 'Mandarin Chinese',
    'ef': 'Spanish',
    'em': 'Spanish',
    'ff': 'French',
    'hf': 'Hindi',
    'hm': 'Hindi',
    'if': 'Italian',
    'im': 'Italian',
    'jf': 'Japanese',
    'jm': 'Japanese',
    'pf': 'Brazilian Portuguese',
    'pm': 'Brazilian Portuguese'
  };

  const [prefix, ...nameParts] = voice.split('_'); // Extract language prefix and name
  const language = languageMap[prefix] || 'Unknown Language';
  const name = nameParts.join('_');

  return `${name} (${language})`;
}

  // When the component mounts, initialize the audio element and fetch voices
  onMount(() => {
    // Initially, create an empty audio element. It will be replaced when speech is generated
    audioElement = new Audio();

    // Fetch available voices from the API
    fetchVoices();
  });
</script>

<style>
  .animation-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

  img {
    width: 300px;
    height: auto;
  }

  button {
    margin-top: 20px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }

  textarea {
    margin-top: 10px;
    width: 300px;
    height: 100px;
    padding: 10px;
    font-size: 16px;
    resize: none;
  }

  select {
    margin-top: 10px;
    padding: 10px;
    font-size: 16px;
  }
</style>

<div class="animation-container">
  <img src={$currentImage} alt="Animoitu kissa" />
  <textarea on:input={handleTextInput} placeholder="Type text to generate speech"></textarea>
  
  <!-- Voice selection dropdown -->
  <select on:change={handleVoiceChange} value={selectedVoice}>
    {#each voices as voice}
      <option value={voice}>{formatVoice(voice)}</option>
    {/each}
  </select>

  <button on:click={startAnimation}>Start</button>
  <button on:click={stopAnimation}>Stop</button>
</div>
